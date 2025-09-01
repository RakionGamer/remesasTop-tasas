import { createCanvas, loadImage, registerFont } from 'canvas';
import cloudinary from 'cloudinary';
import path from 'path';


try {
    registerFont(path.join(process.cwd(), 'fonts', 'Oswald-Bold.ttf'), { family: 'Oswald' });
} catch (error) {
    console.error("Error al registrar la fuente. Asegúrate de que el archivo 'Arial.ttf' exista en la carpeta /fonts de tu proyecto.", error);
}


const coordinates = {
    chile: { x: 340, y: 300 },
    pagoMovil: { x: 685, y: 300 },
    peru: { x: 340, y: 580 },
    colombia: { x: 340, y: 440 },
    argentina: { x: 810, y: 746 },
    ecuador: { x: 340, y: 723 },
    mexico: { x: 340, y: 1010 },
    usa: { x: 810, y: 585 },
    brasil: { x: 340, y: 867 },
};

const baseImageUrl = 'https://res.cloudinary.com/dvh3nrsun/image/upload/v1756064322/1_ds60ur.jpg';

export async function createImageWithRates(extractedData, paisesAVenezuela) {
    try {
        const baseImage = await loadImage(baseImageUrl);
        const canvas = createCanvas(baseImage.width, baseImage.height);
        const ctx = canvas.getContext('2d');
        ctx.drawImage(baseImage, 0, 0);
        ctx.fillStyle = '#000000';
        ctx.strokeStyle = '#000000';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const customSizes = {
            chile: 49,
            pagoMovil: 49,
            peru: 49,
            colombia: 49,
            argentina: 49,
            mexico: 49,
            usa: 49,
            brasil: 49,
            ecuador: 49,
        };

        const drawTextWithStroke = (text, x, y, fontSize = 49) => {
            ctx.font = `${fontSize}px Oswald`;
            ctx.strokeText(text, x, y);
            ctx.fillText(text, x, y);
        };

        const { numeros = {} } = extractedData || {};



        const numberColombia = numeros.tasaColombia || paisesAVenezuela?.COLOMBIA?.VENEZUELA;
        const numberUsa = numeros.tasaUSA || 'XXXX';
        const tasasMapping = {
            chile: paisesAVenezuela?.CHILE?.VENEZUELA || 'Venezuela',
            pagoMovil: paisesAVenezuela?.CHILE?.PM || 'Chile',
            peru: paisesAVenezuela?.PERU?.VENEZUELA || 'Peru',
            colombia: numberColombia,
            ecuador: paisesAVenezuela?.ECUADOR?.VENEZUELA || 'Ecuador',
            argentina: paisesAVenezuela?.ARGENTINA?.VENEZUELA || 'Argentina',
            mexico: paisesAVenezuela?.MEXICO?.VENEZUELA || 'No Mexico',
            usa: numberUsa,
            brasil: paisesAVenezuela?.BRASIL?.VENEZUELA || 'Brasil',
        };

        Object.entries(tasasMapping).forEach(([pais, tasa]) => {
            if (tasa && coordinates[pais]) {
                const fontSize = customSizes[pais] || 48;
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


