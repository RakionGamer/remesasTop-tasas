import { createCanvas, loadImage, registerFont } from 'canvas';
import cloudinary from 'cloudinary';
import path from 'path';


try {
    registerFont(path.join(process.cwd(), 'fonts', 'Oswald-Bold.ttf'), { family: 'Oswald' });
} catch (error) {
    console.error("Error al registrar la fuente. Asegúrate de que el archivo 'Arial.ttf' exista en la carpeta /fonts de tu proyecto.", error);
}

const coordinates = {
    chile: { x: 378, y: 380 },
    peru: { x: 378, y: 538 },
    colombia: { x: 378, y: 702 },   
    argentina: { x: 378, y: 880 }
};

const baseImageUrl = 'https://res.cloudinary.com/dvh3nrsun/image/upload/v1756249047/5_yykkg7.jpg';

export async function createImageWithRatesUSA(extractedData) {
    try {
        const baseImage = await loadImage(baseImageUrl);
        const canvas = createCanvas(baseImage.width, baseImage.height);
        const ctx = canvas.getContext('2d');
        ctx.drawImage(baseImage, 0, 0);
        ctx.fillStyle = '#000000';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const customSizes = {
            peru: 51,
            chile: 51,
            colombia: 51,
            argentina: 51,
        };
        const drawTextWithStroke = (text, x, y, fontSize = 51) => {
            ctx.font = `${fontSize}px Oswald`;
            ctx.strokeText(text, x, y);
            ctx.fillText(text, x, y);
        };


        const { numeros = {} } = extractedData || {};
        const tasasMapping = {
            chile: numeros.tasaUSAChile || 'No disponible',
            peru: numeros.tasaUSAPeru || 'No disponible',
            colombia: numeros.tasaUSAColombia || 'No disponible',
            argentina: numeros.tasaUSAArgentina || 'No disponible',
        };
        Object.entries(tasasMapping).forEach(([pais, tasa]) => {
            if (tasa && coordinates[pais]) {
                const fontSize = customSizes[pais] || 48;
                const strokeWidth = pais === 'peru' ? 4 : 6;
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

