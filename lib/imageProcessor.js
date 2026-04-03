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
  chile: { x: 350, y: 417 },
  pagoMovil: { x: 715, y: 426 },
  peru: { x: 350, y: 704 },
  colombia: { x: 350, y: 560 },
  argentina: { x: 864, y: 870 },
  ecuador: { x: 350, y: 826 },
  mexico: { x: 864, y: 575 },
  usa: { x: 864, y: 715 },
  brasil: { x: 350, y: 960 },
};

const baseImageUrl =
  "https://res.cloudinary.com/dvh3nrsun/image/upload/v1775192441/09_00_am_-_09_00_pm_h9tqtu.png";

export async function createImageWithRates(extractedData, paisesAVenezuela) {
  try {
    const baseImage = await loadImage(baseImageUrl);
    const canvas = createCanvas(baseImage.width, baseImage.height);
    const ctx = canvas.getContext("2d");

    ctx.drawImage(baseImage, 0, 0);
    ctx.fillStyle = "#FFFFFF";
    ctx.strokeStyle = "#FFFFFF";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // --- NUEVA LÓGICA DE FECHA Y HORA (VENEZUELA) ---
    const now = new Date();

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

    // Usar italic para la fecha y hora
    drawTextWithLetterSpacing(ctx, fechaStr, 235, 162, 5, 'italic 32px "Libre Baskerville"');
    drawTextWithLetterSpacing(ctx, horaStr, 579, 164, 5, 'italic 32px "Libre Baskerville"');
    ctx.textAlign = "center";

    const customSizes = {
      chile: 56,
      pagoMovil: 56,
      peru: 56,
      colombia: 56,
      argentina: 56,
      mexico: 56,
      usa: 56,
      brasil: 56,
      ecuador: 56,
    };

    const drawTextWithStroke = (text, x, y, fontSize = 56) => {
      ctx.font = `${fontSize}px Oswald`;
      ctx.strokeText(text, x, y);
      ctx.fillText(text, x, y);
    };

    const numeros = extractedData || {};

    const calcularTasaCompra = (tasaVenta) => {
      if (!tasaVenta) return null;
      const numeroDecimal = parseFloat(tasaVenta.replace(",", "."));
      const tasaCompra = numeroDecimal - 0.0003;
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