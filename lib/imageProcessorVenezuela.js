import { createCanvas, loadImage, registerFont } from 'canvas';
import cloudinary from 'cloudinary';
import path from 'path';
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
  console.error("Error al registrar la fuente. Asegúrate de que los archivos '.ttf' existan en la carpeta /fonts de tu proyecto.", error);
}


const coordinates = {
  chile: { x: 415, y: 531 },
  peru: { x: 415, y: 822 },
  colombia: { x: 415, y: 677 },
  usa: { x: 998, y: 838 },
  ecuador: { x: 415, y: 961 },
  brasil: { x: 415, y: 1100 },
  mexico: { x: 998, y: 690 },
  argentina: { x: 998, y: 984 }
};

const baseImageUrl = 'https://res.cloudinary.com/dvh3nrsun/image/upload/v1787200214/ChatGPT_Image_20_ago_2026_12_29_45_a.m._fvg5ji.png';

export async function createImageWithRatesVenezuela(extractedData, tasasVenezuela) {
  try {
    const baseImage = await loadImage(baseImageUrl);
    const canvas = createCanvas(baseImage.width, baseImage.height);
    const ctx = canvas.getContext('2d');

    ctx.drawImage(baseImage, 0, 0);
    ctx.fillStyle = "#FFFFFF";
    ctx.strokeStyle = "#FFFFFF";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // --- LÓGICA DE FECHA Y HORA (VENEZUELA) ---
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
    drawHeaderDateText(ctx, horaStr, 677, 270, 3, '30px "Cinzel Bold"');

    // --- RENDERIZADO DE TASAS ---
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#d3d2d0";
    ctx.strokeStyle = "#d3d2d0";

    const customSizes = {
      peru: 62,
      chile: 62,
      colombia: 62,
      usa: 62,
      ecuador: 62,
      brasil: 62,
      mexico: 62,
      argentina: 62,
    };

    const drawTextWithStroke = (text, x, y, fontSize = 62) => {
      ctx.font = `${fontSize}px Oswald`;
      ctx.strokeText(text, x, y);
      ctx.fillText(text, x, y);
    };

    const numeros = extractedData || {};

    console.log('Numeros Venezuela:', numeros)

    const tasasMapping = {
      chile: numeros?.tasaVenezuelaChile ? numeros.tasaVenezuelaChile : (tasasVenezuela?.CHILE || 'No disponible'),
      peru: numeros?.tasaVenezuelaPeru ? numeros.tasaVenezuelaPeru : (tasasVenezuela?.PERU || 'No disponible'),
      colombia: numeros?.tasaVenezuelaColombia ? numeros.tasaVenezuelaColombia : (tasasVenezuela?.COLOMBIA || 'No disponible'),
      ecuador: numeros?.tasaVenezuelaEcuador ? numeros.tasaVenezuelaEcuador : (tasasVenezuela?.ECUADOR || 'No disponible'),
      brasil: numeros?.tasaVenezuelaBrasil ? numeros.tasaVenezuelaBrasil : (tasasVenezuela?.BRASIL || 'No disponible'),
      mexico: numeros?.tasaVenezuelaMexico ? numeros.tasaVenezuelaMexico : (tasasVenezuela?.MEXICO || 'No disponible'),
      argentina: numeros?.tasaVenezuelaArgentina ? numeros.tasaVenezuelaArgentina : (tasasVenezuela?.ARGENTINA || 'No disponible'),
      usa: numeros?.tasaVenezuelaUSA ? numeros.tasaVenezuelaUSA : (tasasVenezuela?.USA || tasasVenezuela?.EEUU || 'XXXX'),
    };

    Object.entries(tasasMapping).forEach(([pais, tasa]) => {
      if (tasa && coordinates[pais]) {
        const fontSize = customSizes[pais] || 48;

        drawTextWithStroke(
          String(tasa),
          coordinates[pais].x,
          coordinates[pais].y,
          fontSize
        );
      }
    });

    const buffer = canvas.toBuffer('image/jpeg', { quality: 0.9 });

    return new Promise((resolve, reject) => {
      const stream = cloudinary.v2.uploader.upload_stream(
        {
          folder: 'processed_rates_images',
          resource_type: 'image',
          format: 'jpg',
          public_id: `rates_${Date.now()}`
        },
        (error, result) => {
          if (error) return reject(error);
          resolve(result.secure_url);
        }
      );
      stream.end(buffer);
    });

  } catch (error) {
    console.error('Error procesando imagen:', error);
    throw error;
  }
}