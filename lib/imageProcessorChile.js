import { createCanvas, loadImage, registerFont } from "canvas";
import cloudinary from "cloudinary";
import path from "path";

try {
  registerFont(path.join(process.cwd(), "fonts", "Oswald-Bold.ttf"), {
    family: "Oswald",
  });

  registerFont(path.join(process.cwd(), "fonts", "LibreBaskerville-Italic.ttf"), {
    family: "Libre Baskerville",
    style: "italic"
  });

} catch (error) {
  console.error(
    "Error al registrar la fuente. Asegúrate de que el archivo 'Arial.ttf' o los correspondientes existan en la carpeta /fonts de tu proyecto.",
    error
  );
}

const coordinates = {
  colombia: { x: 344, y: 419 },
  peru: { x: 344, y: 559 },
  usa: { x: 344, y: 701 },
  mexico: { x: 344, y: 830 },
  ecuador: { x: 344, y: 963 },
  brasil: { x: 866, y: 665 },
  argentina: { x: 866, y: 832 },
};

const baseImageUrl =
  "https://res.cloudinary.com/dvh3nrsun/image/upload/v1775192335/3_bxhhmy.png";

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
      colombia: 56,
      peru: 56,
      usa: 56,
      mexico: 56,
      ecuador: 56,
      brasil: 56,
      argentina: 56,
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

    function drawTextWithLetterSpacing(ctx, text, x, y, letterSpacing, font) {
      ctx.save();
      ctx.font = font;
      ctx.textAlign = "left";
      let currentX = x;
      for (let i = 0; i < text.length; i++) {
        const char = text[i];
        ctx.fillText(char, currentX, y);
        currentX += ctx.measureText(char).width + letterSpacing;
      }
      ctx.restore();
    }

    drawTextWithLetterSpacing(ctx, fechaStr, 235, 162, 5, 'italic 32px "Libre Baskerville"');
    drawTextWithLetterSpacing(ctx, horaStr, 579, 164, 5, 'italic 32px "Libre Baskerville"');
    ctx.textAlign = "center";

    const drawTextWithStroke = (text, x, y, fontSize = 56) => {
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
        const fontSize = customSizes[pais] || 56;
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