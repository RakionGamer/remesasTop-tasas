import { createCanvas, loadImage, registerFont } from 'canvas';
import cloudinary from 'cloudinary';
import path from 'path';


try {
    registerFont(path.join(process.cwd(), 'fonts', 'Oswald-Bold.ttf'), { family: 'Oswald' });
} catch (error) {
    console.error("Error al registrar la fuente. Asegúrate de que el archivo 'Arial.ttf' exista en la carpeta /fonts de tu proyecto.", error);
}


const coordinates = {
    colombia: { x: 349, y: 333 },
    peru: { x: 349, y: 463 },
    usa: { x: 349, y: 600 },
    mexico: { x: 349, y: 740 },
    ecuador: { x: 349, y: 868 },
    brasil: { x: 349, y: 984 },
    argentina: { x: 895, y: 333 }
};

const baseImageUrl = 'https://res.cloudinary.com/dvh3nrsun/image/upload/v1756064323/2_hwr0zf.jpg';

export async function createImageWithRatesChile(extractedData, chileRates) {
    try {
        const baseImage = await loadImage(baseImageUrl);
        const canvas = createCanvas(baseImage.width, baseImage.height);
        const ctx = canvas.getContext('2d');
        ctx.drawImage(baseImage, 0, 0);
        ctx.fillStyle = '#000000';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const customSizes = {
            colombia: 49,
            peru: 49,
            usa: 49,
            mexico: 49,
            ecuador: 49,
            brasil: 49,
            argentina: 49,
        };

        const drawTextWithStroke = (text, x, y, fontSize = 49) => {
            ctx.font = `${fontSize}px Oswald`;
            ctx.strokeText(text, x, y);
            ctx.fillText(text, x, y);
        };

        const { numeros = {} } = extractedData || {};

        console.log('Numeros: ', numeros);

        const numberColombia = numeros.tasaChileColombia || chileRates?.COLOMBIA;
        const numberUsa = numeros.tasaChileUSA || 'XXXX';

        const tasasMapping = {
            peru: chileRates?.PERU || 'No disponible',
            argentina: chileRates?.ARGENTINA || 'No disponible',
            mexico: chileRates?.MEXICO || 'No disponible',
            brasil: chileRates?.BRASIL || 'No disponible',
            panama: chileRates?.PANAMA || 'No disponible',
            colombia: numberColombia,
            españa: chileRates?.ESPAÑA || 'No disponible',
            ecuador: chileRates?.ECUADOR || 'No disponible',
            usa: numberUsa,
        };

        Object.entries(tasasMapping).forEach(([pais, tasa]) => {
            if (tasa && coordinates[pais]) {
                const fontSize = customSizes[pais] || 49;
                drawTextWithStroke(String(tasa), coordinates[pais].x, coordinates[pais].y, fontSize, 6);
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
