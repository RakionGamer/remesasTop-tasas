import { createCanvas, loadImage, registerFont } from "canvas";
import cloudinary from "cloudinary";
import path from "path";

try {
  registerFont(path.join(process.cwd(), "fonts", "Arial.ttf"), {
    family: "Arial",
  });
} catch (error) {
  console.error(
    "Error al registrar la fuente. Asegúrate de que el archivo 'Arial.ttf' exista en la carpeta /fonts de tu proyecto.",
    error
  );
}

const coordinates = {
  chile: { x: 670, y: 730 },
  pm: { x: 305, y: 890 },
};

const baseImageUrl =
  "https://res.cloudinary.com/dvh3nrsun/image/upload/v1767838032/PagoMovil_liltgf.png";

export async function createImageWithRatesChileVenezuela(extractedData) {
  try {
    const baseImage = await loadImage(baseImageUrl);
    const canvas = createCanvas(baseImage.width, baseImage.height);
    const ctx = canvas.getContext("2d");
    ctx.drawImage(baseImage, 0, 0);

    ctx.fillStyle = "#000000";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    const customSizes = {
      chile: 105,
      pm: 90,
    };

    const drawTextWithStroke = (
      text,
      x,
      y,
      fontSize = 28,
    ) => {
      ctx.font = `${fontSize}px Arial`;
      ctx.strokeText(text, x, y);
      ctx.fillText(text, x, y);
    };

    let numeros;

    if (extractedData.numeros) {
      numeros = extractedData.numeros;
      numeros.chile = extractedData.chile || numeros.chile;
      numeros.pm = extractedData.pm || numeros.pm;
    } else if (extractedData.valorOriginal && extractedData.valorConResta) {
      numeros = {
        chile: extractedData.valorOriginal,
        pm: extractedData.valorConResta,
      };
    } else {
      throw new Error("Estructura de datos no válida");
    }

   
    const tasasMapping = {
      chile:
        extractedData.chile || extractedData.valorOriginal || "No disponible",
        pm: extractedData.pm || extractedData.valorConResta || "No disponible",
    };

    Object.entries(tasasMapping).forEach(([pais, tasa]) => {
      if (tasa && tasa !== "No disponible" && coordinates[pais]) {
        const fontSize = customSizes[pais] || 28;
        const strokeWidth = 18;
        drawTextWithStroke(
          String(tasa),
          coordinates[pais].x,
          coordinates[pais].y,
          fontSize,
          strokeWidth
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
