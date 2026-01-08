import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { validarTasasPorCantidad } from "../../../lib/cleaner";

const MODELOS_FALLBACK = [
  "gemini-2.5-flash",
  "gemini-2.5-pro",
  "gemini-2.5-flash-lite",
];

async function llamarGeminiConFallback(
  ai,
  contents,
  maxReintentosPorModelo = 2
) {
  let ultimoError = null;

  for (const modelo of MODELOS_FALLBACK) {
    console.log(`🔄 Intentando con modelo: ${modelo}`);

    for (let intento = 0; intento < maxReintentosPorModelo; intento++) {
      try {
        const result = await ai.models.generateContent({
          model: modelo,
          contents,
        });

        console.log(`✅ Éxito con ${modelo} (intento ${intento + 1})`);
        return { result, modeloUsado: modelo };
      } catch (error) {
        ultimoError = error;
        const es503 = error?.status === 503 || error?.code === 503;
        const esRateLimitExceeded =
          error?.status === 429 || error?.code === 429;
        const esUltimoIntento = intento === maxReintentosPorModelo - 1;

        console.log(
          `❌ Error en ${modelo} (intento ${intento + 1}):`,
          error?.message
        );

        if ((es503 || esRateLimitExceeded) && !esUltimoIntento) {
          const espera = Math.pow(2, intento) * 1000;
          console.log(`⏳ Esperando ${espera}ms antes de reintentar...`);
          await new Promise((resolve) => setTimeout(resolve, espera));
        } else if (esUltimoIntento) {
          console.log(
            `⚠️ Agotados los reintentos para ${modelo}, probando siguiente modelo...`
          );
          break;
        } else {
          throw error;
        }
      }
    }
  }

  throw new Error(
    `Todos los modelos fallaron. Último error: ${
      ultimoError?.message || "Desconocido"
    }`
  );
}

export async function POST(request) {
  try {
    const { url } = await request.json();
    if (!url)
      return NextResponse.json({ error: "No se envió URL" }, { status: 400 });

    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    if (!GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY no configurada" },
        { status: 500 }
      );
    }

    const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
    console.log("📥 Descargando imagen...");
    const imageResp = await fetch(url);
    if (!imageResp.ok)
      throw new Error(`No se pudo descargar la imagen: ${imageResp.status}`);

    const arrayBuffer = await imageResp.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");

    const prompt = `
Eres un sistema OCR avanzado. Analiza la imagen y genera un JSON estructurado de esta forma:
{
  "tasas": {
    "<pais>": "<valor>",
    ...
  },
  "otros_textos": ["<texto extra1>", "<texto extra2>", ...]
}

Reglas obligatorias:
- "tasas" debe contener solo pares país-valor numérico (decimales completos o enteros), también que esté conformado por una coma.
- "otros_textos" incluye todo el texto que no sea una tasa (títulos, fechas, URLs, etc).
- Devuelve **únicamente JSON válido**, sin explicaciones, sin texto adicional, sin comentarios.
- Si encuentras "Estados Unidos" o "USA", usa "USA" como clave.
- Si encuentras "Brasil" o "Brazil", usa "Brasil" como clave.
`;

    const contents = [
      {
        inlineData: {
          mimeType: imageResp.headers.get("content-type") || "image/jpeg",
          data: base64,
        },
      },
      { text: prompt },
    ];

    const { result, modeloUsado } = await llamarGeminiConFallback(ai, contents);

    let parsedText =
      result?.text ??
      (Array.isArray(result?.output)
        ? result.output
            .map((o) => o?.content?.map((c) => c?.text || "").join(""))
            .join("\n")
        : "");

    let jsonLimpio;
    try {
      jsonLimpio = JSON.parse(parsedText);
    } catch {
      const match = parsedText.match(/\{[\s\S]*\}/);
      jsonLimpio = match
        ? JSON.parse(match[0])
        : { tasas: {}, otros_textos: [] };
    }

    const tasasValidadas = await validarTasasPorCantidad(jsonLimpio);

    return NextResponse.json({
      tasasValidadas,
      otros_textos: jsonLimpio.otros_textos || [],
      modeloUsado,
    });
  } catch (err) {
    console.error("❌ OCR (Gemini) error final:", err);

    if (err?.code === 503 || err?.status === 503) {
      return NextResponse.json(
        {
          error:
            "Todos los modelos de Gemini están sobrecargados. Por favor intenta en 1 minuto.",
          retry: true,
          code: 503,
        },
        { status: 503 }
      );
    }

    if (err?.code === 429 || err?.status === 429) {
      return NextResponse.json(
        {
          error:
            "Se alcanzó el límite de solicitudes. Por favor espera unos minutos.",
          retry: true,
          code: 429,
        },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { error: err?.message || "OCR failed" },
      { status: 500 }
    );
  }
}
