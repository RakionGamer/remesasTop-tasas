import { createCanvas, loadImage, registerFont } from "canvas";
import cloudinary from "cloudinary";
import path from "path";
import fs from "fs";

// --- REGISTRO DE FUENTES ---
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
  console.error("Error al registrar fuentes:", error);
}

const coordinates = {
  // Columna Izquierda (textAlign: "center", textBaseline: "middle")
  chile: { x: 406, y: 525 },
  colombia: { x: 406, y: 669 },
  peru: { x: 406, y: 822 },
  ecuador: { x: 406, y: 965 },
  brasil: { x: 406, y: 1106 },

  // Columna Derecha (textAlign: "center", textBaseline: "middle")
  pagoMovil: { x: 841, y: 541 },

  mexico: { x: 1008, y: 685 },
  usa: { x: 1008, y: 840 },
  argentina: { x: 1008, y: 990 },
};

const baseImageUrl =
  "https://res.cloudinary.com/dvh3nrsun/image/upload/v1787190400/ChatGPT_Image_19_ago_2026_09_41_21_p.m._wzmoyo.png";

export async function createImageWithRates(extractedData, paisesAVenezuela) {
  try {
    const baseImage = await loadImage(baseImageUrl);
    const canvas = createCanvas(baseImage.width, baseImage.height);
    const ctx = canvas.getContext("2d");

    ctx.drawImage(baseImage, 0, 0);

    // --- LÓGICA DE FECHA Y HORA (VENEZUELA) ---
    const now = new Date();

    const fechaStr = now.toLocaleDateString("es-VE", {
      timeZone: "America/Caracas",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

    const horaStr = now.toLocaleTimeString("en-US", {
      timeZone: "America/Caracas",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

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

    // Dibujado de fecha y hora usando la familia registrada "Cinzel Bold"
    drawHeaderDateText(ctx, fechaStr, 305, 270, 3, '30px "Cinzel Bold"');
    drawHeaderDateText(ctx, horaStr, 680, 270, 3, '30px "Cinzel Bold"');

    // --- RENDERIZADO DE TASAS ---
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#d3d2d0";
    ctx.strokeStyle = "#d3d2d0";

    const customSizes = {
      chile: 62,
      pagoMovil: 62,
      peru: 62,
      colombia: 62,
      argentina: 62,
      mexico: 62,
      usa: 62,
      brasil: 62,
      ecuador: 62,
    };

    const drawTextWithStroke = (text, x, y, fontSize = 62) => {
      ctx.font = `${fontSize}px Oswald`;
      ctx.strokeText(text, x, y);
      ctx.fillText(text, x, y);
    };

    const numeros = extractedData || {};

    const calcularTasaCompra = (tasaVenta) => {
      if (!tasaVenta) return null;
      const numeroDecimal = parseFloat(tasaVenta.replace(",", "."));
      const tasaCompra = numeroDecimal - 0.002;
      return tasaCompra.toFixed(5).replace(".", ",");
    };

    const tasaPagoMovil = calcularTasaCompra(numeros?.tasaChile);

    const numberColombia = numeros?.tasaColombia
      ? numeros?.tasaColombia
      : paisesAVenezuela?.COLOMBIA?.VENEZUELA;
    const numberUsa = numeros?.tasaUSA || "XXXX";

    const tasasMapping = {
      chile: numeros?.tasaChile
        ? numeros?.tasaChile
        : paisesAVenezuela?.CHILE?.VENEZUELA || "Venezuela",
      pagoMovil: tasaPagoMovil ? tasaPagoMovil : paisesAVenezuela?.CHILE?.PM,
      peru:
        numeros?.tasaPeru ||
        paisesAVenezuela?.PERU?.VENEZUELA ||
        "No disponible",
      colombia: numberColombia || "No disponible",
      ecuador: paisesAVenezuela?.ECUADOR?.VENEZUELA || "XXXX",
      argentina: paisesAVenezuela?.ARGENTINA?.VENEZUELA || "XXXX",
      mexico:
        numeros?.tasaMexico ||
        paisesAVenezuela?.MEXICO?.VENEZUELA ||
        "No Mexico",
      usa: numberUsa,
      brasil:
        numeros?.tasaBrasil || paisesAVenezuela?.BRASIL?.VENEZUELA || "Brasil",
    };

    Object.entries(tasasMapping).forEach(([pais, tasa]) => {
      if (tasa && coordinates[pais]) {
        const fontSize = customSizes[pais] || 48;
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