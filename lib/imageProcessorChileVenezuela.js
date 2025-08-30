import { createCanvas, loadImage, registerFont } from 'canvas';
import cloudinary from 'cloudinary';
import path from 'path';

try {
    registerFont(path.join(process.cwd(), 'fonts', 'Arial.ttf'), { family: 'Arial' });
} catch (error) {
    console.error("Error al registrar la fuente. Asegúrate de que el archivo 'Arial.ttf' exista en la carpeta /fonts de tu proyecto.", error);
}

const coordinates = {
    fecha: { x: 610, y: 256 },        
    hora: { x: 1130, y: 264 },
    chile: { x: 1130, y: 1030 },
    pm: { x: 1000, y: 1300 },    
};

const baseImageUrl = 'https://res.cloudinary.com/dvh3nrsun/image/upload/v1756064322/1_ds60ur.jpg';

export async function createImageWithRatesChileVenezuela(extractedData) {
    try {
        const baseImage = await loadImage(baseImageUrl);
        const canvas = createCanvas(baseImage.width, baseImage.height);
        const ctx = canvas.getContext('2d');
        ctx.drawImage(baseImage, 0, 0);
        
        // Configurar estilos una vez
        ctx.fillStyle = '#FFFFFF';
        ctx.strokeStyle = '#000000';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const customSizes = {
            fecha: 48,
            hora: 48,
            chile: 105,
            pm: 105,
        };

        const drawTextWithStroke = (text, x, y, fontSize = 48, strokeWidth = 18) => {
            ctx.font = `bold ${fontSize}px Arial`;
            ctx.lineWidth = strokeWidth;
            // Dibujar primero el stroke (contorno)
            ctx.strokeText(text, x, y);
            // Luego el relleno
            ctx.fillText(text, x, y);
        };

        let numeros;
        
        if (extractedData.numeros) {
            numeros = extractedData.numeros;
            numeros.chile = extractedData.chile || numeros.chile;
            numeros.pm = extractedData.pm || numeros.pm;
        } else if (extractedData.valorOriginal && extractedData.valorConResta) {
            // Datos manuales (tasa ingresada por usuario)
            const now = new Date();
            numeros = {
                fecha: {
                    dia: now.getDate().toString().padStart(2, '0'),
                    mes: (now.getMonth() + 1).toString().padStart(2, '0'),
                    anio: now.getFullYear().toString(),
                    hora: now.getHours().toString().padStart(2, '0'),
                    minutos: now.getMinutes().toString().padStart(2, '0')
                },
                chile: extractedData.valorOriginal,
                pm: extractedData.valorConResta
            };
        } else {
            throw new Error('Estructura de datos no válida');
        }

        // Dibujar fecha
        if (numeros.fecha && numeros.fecha.dia && numeros.fecha.mes) {
            const fechaTexto = `${numeros.fecha.dia}/${numeros.fecha.mes}/${numeros.fecha.anio || '2025'}`;
            drawTextWithStroke(fechaTexto, coordinates.fecha.x, coordinates.fecha.y, customSizes.fecha, 8);
        }

        // Dibujar hora
        if (numeros.fecha && numeros.fecha.hora && numeros.fecha.minutos) {
            const horaTexto = `${numeros.fecha.hora}:${String(numeros.fecha.minutos).padStart(2, '0')}`;
            drawTextWithStroke(horaTexto, coordinates.hora.x, coordinates.hora.y, customSizes.hora, 8);
        }

        // Usar directamente extractedData para las tasas
        const tasasMapping = {
            chile: extractedData.chile || extractedData.valorOriginal || 'No disponible',
            pm: extractedData.pm || extractedData.valorConResta || 'No disponible',
        };

        Object.entries(tasasMapping).forEach(([pais, tasa]) => {
            if (tasa && tasa !== 'No disponible' && coordinates[pais]) {
                const fontSize = customSizes[pais] || 48;
                const strokeWidth = 18;
                drawTextWithStroke(String(tasa), coordinates[pais].x, coordinates[pais].y, fontSize, strokeWidth);
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