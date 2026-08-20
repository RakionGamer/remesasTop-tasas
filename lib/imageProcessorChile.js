import { createCanvas, loadImage, registerFont } from "canvas";
import cloudinary from "cloudinary";
import path from "path";
import fs from "fs";

try {
  const oswaldPath = path.join(process.cwd(), "fonts", "Oswald-Bold.ttf");
  const cinzelPath = path.join(process.cwd(), "fonts", "Cinzel-Bold.ttf");

  if (fs.existsSync(oswaldPath)) {
    registerFont(oswaldPath, { family: "Oswald" });
  } else {
    console.error("⚠️ No se encontró la fuente Oswald en:", oswaldPath);
  }

  if (fs.existsSync(cinzelPath)) {
    registerFont(cinzelPath, { family: "Cinzel Bold" });
  } else {
    console.error("⚠️ No se encontró la fuente Cinzel Bold en:", cinzelPath);
  }
} catch (error) {
  console.error(
    "Error al registrar la fuente. Asegúrate de que los archivos '.ttf' existan en la carpeta /fonts de tu proyecto.",
    error
  );
}

const coordinates = {
  colombia: { x: 412, y: 529 },
  peru: { x: 412, y: 676 },
  usa: { x: 412, y: 830 },
  mexico: { x: 412, y: 970 },
  ecuador: { x: 412, y: 1115 },
  brasil: { x: 1000, y: 842 },
  argentina: { x: 1000, y: 993 },
};

const baseImageUrl =
  "https://res.cloudinary.com/dvh3nrsun/image/upload/v1787202513/ChatGPT_Image_20_ago_2026_01_08_19_a.m._mwc5gz.png";

export async function createImageWithRatesChile(extractedData, chileRates) {
  try {
    const baseImage = await loadImage(baseImageUrl);
    const canvas = createCanvas(baseImage.width, baseImage.height);
    const ctx = canvas.getContext("2d");

    ctx.drawImage(baseImage, 0, 0);
    ctx.fillStyle = "#FFFFFF";
    ctx.strokeStyle = "#FFFFFF";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    const customSizes = {
      colombia: 62,
      peru: 62,
      usa: 62,
      mexico: 62,
      ecuador: 62,
      brasil: 62,
      argentina: 62,
    };

    // --- NUEVA LÓGICA DE FECHA Y HORA (VENEZUELA) ---
    const now = new Date();

    // Obtener fecha en formato DD/MM/YYYY para la zona horaria de Caracas
    const fechaStr = now.toLocaleDateString('es-VE', {
      timeZone: 'America/Caracas',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });


    const horaStr = now.toLocaleTimeString('en-US', {
      timeZone: 'America/Caracas',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
    // ------------------------------------------------

    // --- FUNCIÓN PARA FECHA Y HORA (CINZEL) ---
    function drawHeaderDateText(ctx, text, x, y, letterSpacing, font) {
      ctx.save();
      ctx.font = font;
      ctx.fillStyle = "#d3d2d0";
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";

      ctx.shadowColor = "rgba(0, 0, 0, 0.8)";
      ctx.shadowBlur = 4;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 2;

      let currentX = x;
      for (let i = 0; i < text.length; i++) {
        const char = text[i];
        ctx.fillText(char, currentX, y);
        currentX += ctx.measureText(char).width + letterSpacing;
      }
      ctx.restore();
    }

    drawHeaderDateText(ctx, fechaStr, 310, 271, 3, '30px "Cinzel Bold"');
    drawHeaderDateText(ctx, horaStr, 690, 271, 3, '30px "Cinzel Bold"');

    // --- RENDERIZADO DE TASAS ---
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#d3d2d0";
    ctx.strokeStyle = "#d3d2d0";

    const drawTextWithStroke = (text, x, y, fontSize = 62) => {
      ctx.font = `${fontSize}px Oswald`;
      ctx.strokeText(text, x, y);
      ctx.fillText(text, x, y);
    };

    const numeros = extractedData || {};

    console.log("Tasas Procesados: ", numeros);

    const numberColombia = numeros?.tasaChileColombia
      ? numeros?.tasaChileColombia
      : chileRates?.COLOMBIA;
    const numberUsa = numeros.tasaChileUSA || "XXXX";

    const tasasMapping = {
      peru: numeros?.tasaChilePeru
        ? numeros?.tasaChilePeru
        : chileRates?.PERU || "No disponible",
      argentina: numeros?.tasaChileArgentina
        ? numeros?.tasaChileArgentina
        : chileRates?.ARGENTINA || "No disponible",
      mexico: numeros?.tasaChileMexico
        ? numeros?.tasaChileMexico
        : chileRates?.MEXICO || "No disponible",
      brasil: numeros?.tasaChileBrasil
        ? numeros?.tasaChileBrasil
        : chileRates?.BRASIL || "No disponible",
      panama: chileRates?.PANAMA || "No disponible",
      colombia: numberColombia,
      españa: chileRates?.ESPAÑA || "No disponible",
      ecuador: numeros?.tasaChileEcuador
        ? numeros?.tasaChileEcuador
        : chileRates?.ECUADOR || "No disponible",
      usa: numberUsa,
    };

    Object.entries(tasasMapping).forEach(([pais, tasa]) => {
      if (tasa && coordinates[pais]) {
        const fontSize = customSizes[pais] || 62;
        drawTextWithStroke(
          String(tasa),
          coordinates[pais].x,
          coordinates[pais].y,
          fontSize,
          6
        );
      }
    });

    const buffer = canvas.toBuffer("image/jpeg", { quality: 0.9 });

    return new Promise((resolve, reject) => {
      const stream = cloudinary.v2.uploader.upload_stream(
        {
          folder: "processed_rates_images",
          resource_type: "image",
          format: "jpg",
          public_id: `rates_${Date.now()}`,
        },
        (error, result) => {
          if (error) return reject(error);
          resolve(result.secure_url);
        }
      );
      stream.end(buffer);
    });
  } catch (error) {
    console.error("Error procesando imagen:", error);
    throw error;
  }
}