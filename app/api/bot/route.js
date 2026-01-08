import TelegramBot from "node-telegram-bot-api";
import fetch from "node-fetch";
import cloudinary from "cloudinary";
import { createImageWithRates } from "../../../lib/imageProcessor.js";
import { createImageWithRatesChile } from "../../../lib/imageProcessorChile.js";
import { createImageWithRatesUSA } from "../../../lib/imageProcessorEEUU.js";
import { createImageWithRatesVenezuela } from "../../../lib/imageProcessorVenezuela.js";
import { createImageWithRatesChileVenezuela } from "../../../lib/imageProcessorChileVenezuela.js";
import { createImageWithRatesChileQuery } from "../../../lib/imageProcessorChileQuery.js";
import { getRates } from "../../../lib/harryTasas.js";

cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const token = process.env.TELEGRAM_BOT_TOKEN;
const bot = new TelegramBot(token);

export async function POST(req) {
  try {
    const rates = await getRates();
    const ecuadorRates = rates["DESDE ECUADOR"];
    const mexicoRates = rates["DESDE MEXICO"];
    const venezuelaRates = rates["DESDE VENEZUELA"];
    const peruRates = rates["DESDE PERU"];
    const chileRates = rates["DESDE CHILE"];
    const argentinaRates = rates["DESDE ARGENTINA"];
    const brasilRates = rates["DESDE BRASIL"];
    const colombiaRates = rates["DESDE COLOMBIA"];

    const paisesAVenezuela = {
      CHILE: {
        VENEZUELA: chileRates["VENEZUELA"],
        PM: chileRates["PM"],
      },
      ARGENTINA: {
        VENEZUELA: argentinaRates["VENEZUELA"],
        PM: argentinaRates["PM"],
      },
      ECUADOR: {
        VENEZUELA: ecuadorRates["VENEZUELA"],
        PM: ecuadorRates["PM"],
      },
      COLOMBIA: {
        VENEZUELA: colombiaRates["VENEZUELA"],
        PM: colombiaRates["PM"],
      },
      PERU: {
        VENEZUELA: peruRates["VENEZUELA"],
        PM: peruRates["PM"],
      },
      MEXICO: {
        VENEZUELA: mexicoRates["VENEZUELA"],
        PM: mexicoRates["PM"],
      },
      BRASIL: {
        VENEZUELA: brasilRates["VENEZUELA"],
        PM: brasilRates["PM"],
      },
    };

    const body = await req.json();
    const chatId =
      body.message?.chat?.id || body.callback_query?.message?.chat?.id;

    if (!chatId) {
      return new Response("Request body does not contain a chat ID.", {
        status: 400,
      });
    }

    // Definir keyboards al inicio
    const keyboard = {
      reply_markup: {
        keyboard: [[{ text: "⚡ Generar Tasas Speed" }]],
        resize_keyboard: true,
        one_time_keyboard: false,
      },
    };

    const inlineKeyboard = {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "⚡ Procesar Imágenes de Speed",
              callback_data: "process_speed_images",
            },
          ],
        ],
      },
    };

    // Manejo de callback queries (botones inline)
    if (body.callback_query) {
      const callbackData = body.callback_query.data;

      if (callbackData === "generate_venezuela_image") {
        try {
          await bot.sendMessage(
            chatId,
            "⏳ Generando imagen de Venezuela Desde... Por favor espera."
          );

          const rates = await getRates();
          const venezuelaRates = rates["DESDE VENEZUELA"];

          if (!venezuelaRates) {
            await bot.sendMessage(
              chatId,
              "⚠️ No se pudieron obtener las tasas de Venezuela."
            );
            return new Response("ok", { status: 200 });
          }

          const processedImageUrlVenezuela =
            await createImageWithRatesVenezuela({}, venezuelaRates);
          await bot.sendPhoto(chatId, processedImageUrlVenezuela, {
            caption:
              "✅ Tasas de cambio actualizadas. Envíos desde Venezuela a",
          });
        } catch (error) {
          console.error("Error generando imagen Venezuela:", error);
          await bot.sendMessage(
            chatId,
            "⚠️ Error al generar la imagen de Venezuela. Intenta de nuevo."
          );
        }
      }

      if (callbackData === "process_speed_images") {
        try {
          await bot.sendMessage(
            chatId,
            "⚡ Procesando imágenes de Speed... Por favor espera."
          );

          const rates = await getRates();
          const venezuelaRates = rates["DESDE VENEZUELA"];
          const chileRates = rates["DESDE CHILE"];
          const ecuadorRates = rates["DESDE ECUADOR"];
          const mexicoRates = rates["DESDE MEXICO"];
          const peruRates = rates["DESDE PERU"];
          const argentinaRates = rates["DESDE ARGENTINA"];
          const brasilRates = rates["DESDE BRASIL"];
          const colombiaRates = rates["DESDE COLOMBIA"];

          const paisesAVenezuela = {
            CHILE: {
              VENEZUELA: chileRates["VENEZUELA"],
              PM: chileRates["PM"],
            },
            ARGENTINA: {
              VENEZUELA: argentinaRates["VENEZUELA"],
              PM: argentinaRates["PM"],
            },
            ECUADOR: {
              VENEZUELA: ecuadorRates["VENEZUELA"],
              PM: ecuadorRates["PM"],
            },
            COLOMBIA: {
              VENEZUELA: colombiaRates["VENEZUELA"],
              PM: colombiaRates["PM"],
            },
            PERU: {
              VENEZUELA: peruRates["VENEZUELA"],
              PM: peruRates["PM"],
            },
            MEXICO: {
              VENEZUELA: mexicoRates["VENEZUELA"],
              PM: mexicoRates["PM"],
            },
            BRASIL: {
              VENEZUELA: brasilRates["VENEZUELA"],
              PM: brasilRates["PM"],
            },
          };

          if (venezuelaRates) {
            const processedImageUrlVenezuela =
              await createImageWithRatesVenezuela({}, venezuelaRates);
            await bot.sendPhoto(chatId, processedImageUrlVenezuela, {
              caption: "✅ Speed - Envíos desde Venezuela a",
            });
          }

          if (chileRates) {
            const processedImageUrlChile = await createImageWithRatesChile(
              {},
              chileRates
            );
            await bot.sendPhoto(chatId, processedImageUrlChile, {
              caption: "✅ Speed - Envíos desde Chile a",
            });
          }

          const processedImageUrl = await createImageWithRates(
            {},
            paisesAVenezuela
          );
          await bot.sendPhoto(chatId, processedImageUrl, {
            caption: "✅ Speed - Envíos a Venezuela desde",
          });

          await bot.sendMessage(
            chatId,
            "🚀 ¡Todas las imágenes de Speed han sido procesadas exitosamente!"
          );
        } catch (error) {
          console.error("Error procesando imágenes Speed:", error);
          await bot.sendMessage(
            chatId,
            "⚠️ Error al procesar las imágenes de Speed. Intenta de nuevo."
          );
        }
      }

      await bot.answerCallbackQuery(body.callback_query.id);
      return new Response("ok", { status: 200 });
    }

    // Manejo de mensajes de texto
    if (body.message?.text) {
      try {
        const messageText = body.message.text.trim();

        // PRIMERO: Procesamiento de tasas con formato número (ej: 0.76045)
        function procesarTasa(texto) {
          const regexTasa = /^(\d+[.,]\d+)$/;
          const match = texto.match(regexTasa);

          if (match) {
            const valorOriginal = match[1];
            let valorNormalizado = valorOriginal.replace(",", ".");
            const valorNumerico = parseFloat(valorNormalizado);

            if (isNaN(valorNumerico)) {
              return null;
            }
            const [parteEntera, parteDecimal] = valorNormalizado.split(".");
            const parteDecimalCompleta = (parteDecimal || "").padEnd(5, "0");
            const valorCompleto = `${parteEntera}.${parteDecimalCompleta}`;
            const valorCompletoNumerico = parseFloat(valorCompleto);
            const valorFormateado = valorCompleto.replace(".", ",");
            const valorConResta = valorCompletoNumerico - 0.0003;
            const valorRestaFormateado = valorConResta
              .toFixed(5)
              .replace(".", ",");

            return {
              valorOriginal: valorFormateado,
              valorConResta: valorRestaFormateado,
              valorNumerico: valorCompletoNumerico,
            };
          }
          return null;
        }

        const resultadoTasa = procesarTasa(messageText);
        if (resultadoTasa) {
          await bot.sendMessage(
            chatId,
            "⏳ Procesando tasa... Por favor espera.",
            keyboard
          );

          const tasasVenezuela = {
            valorOriginal: resultadoTasa.valorOriginal,
            valorConResta: resultadoTasa.valorConResta,
          };

          const processedImageUrlChile =
            await createImageWithRatesChileVenezuela(tasasVenezuela);
          await bot.sendPhoto(chatId, processedImageUrlChile, {
            caption: `Tasa procesada correctamente ✅`,
            ...keyboard,
          });

          return new Response("ok", { status: 200 });
        }

        // SEGUNDO: Handler para el botón "Generar Tasas Speed"
        if (messageText === "⚡ Generar Tasas Speed") {
          await bot.sendMessage(
            chatId,
            "⚡ Procesando imágenes de Speed... Por favor espera."
          );

          const rates = await getRates();
          const venezuelaRates = rates["DESDE VENEZUELA"];
          const chileRates = rates["DESDE CHILE"];
          const ecuadorRates = rates["DESDE ECUADOR"];
          const mexicoRates = rates["DESDE MEXICO"];
          const peruRates = rates["DESDE PERU"];
          const argentinaRates = rates["DESDE ARGENTINA"];
          const brasilRates = rates["DESDE BRASIL"];
          const colombiaRates = rates["DESDE COLOMBIA"];

          const paisesAVenezuela = {
            CHILE: {
              VENEZUELA: chileRates["VENEZUELA"],
              PM: chileRates["PM"],
            },
            ARGENTINA: {
              VENEZUELA: argentinaRates["VENEZUELA"],
              PM: argentinaRates["PM"],
            },
            ECUADOR: {
              VENEZUELA: ecuadorRates["VENEZUELA"],
              PM: ecuadorRates["PM"],
            },
            COLOMBIA: {
              VENEZUELA: colombiaRates["VENEZUELA"],
              PM: colombiaRates["PM"],
            },
            PERU: {
              VENEZUELA: peruRates["VENEZUELA"],
              PM: peruRates["PM"],
            },
            MEXICO: {
              VENEZUELA: mexicoRates["VENEZUELA"],
              PM: mexicoRates["PM"],
            },
            BRASIL: {
              VENEZUELA: brasilRates["VENEZUELA"],
              PM: brasilRates["PM"],
            },
          };

          if (venezuelaRates) {
            const processedImageUrlVenezuela =
              await createImageWithRatesVenezuela({}, venezuelaRates);
            await bot.sendPhoto(chatId, processedImageUrlVenezuela, {
              caption: "✅ Speed - Envíos desde Venezuela a",
            });
          }

          if (chileRates) {
            const processedImageUrlChile = await createImageWithRatesChile(
              {},
              chileRates
            );
            await bot.sendPhoto(chatId, processedImageUrlChile, {
              caption: "✅ Speed - Envíos desde Chile a",
            });
          }

          const processedImageUrl = await createImageWithRates(
            {},
            paisesAVenezuela
          );
          await bot.sendPhoto(chatId, processedImageUrl, {
            caption: "✅ Speed - Envíos a Venezuela desde",
          });

          await bot.sendMessage(
            chatId,
            "🚀 ¡Todas las imágenes de Speed han sido procesadas exitosamente!",
            keyboard
          );

          return new Response("ok", { status: 200 });
        }

        // TERCERO: Comandos con formato /comando valor
        const regexComando = /^\/(\w+)\s+([\d.,\s]+)$/;
        const match = messageText.match(regexComando);
        if (match) {
          await bot.sendMessage(
            chatId,
            "⏳ Procesando datos... Por favor espera."
          );
          const pais = match[1].toLowerCase();
          const valores = match[2]
            .split(/[,\s]+/)
            .filter(Boolean)
            .map((v) => parseFloat(v.replace(",", ".")))
            .filter((v) => !isNaN(v));

          if (pais === "vzla" || pais === "venezuela") {
            if (valores.length < 2) {
              await bot.sendMessage(
                chatId,
                "⚠️ Debes ingresar al menos 2 valores. Ejemplo: `/vzla 1060 70`",
                { parse_mode: "Markdown" }
              );
              return new Response("ok", { status: 200 });
            }
            const [menor, mayor] = valores.sort((a, b) => a - b);
            const tasasVenezuela = {
              numeros: {
                tasaColombia: menor,
                tasaUSA: mayor,
              },
            };
            const processedImageUrl = await createImageWithRates(
              tasasVenezuela,
              paisesAVenezuela
            );
            await bot.sendPhoto(chatId, processedImageUrl, {
              caption:
                "✅ Tasas de cambio actualizadas. Envíos a Venezuela desde",
            });

            const processedImageUrlVenezuela =
              await createImageWithRatesVenezuela({}, venezuelaRates);
            await bot.sendPhoto(chatId, processedImageUrlVenezuela, {
              caption:
                "✅ Tasas de cambio actualizadas. Envíos desde Venezuela a",
            });
          }

          if (
            pais === "cl" ||
            pais === "chile" ||
            pais === "usa" ||
            pais === "us"
          ) {
            if (valores.length < 1) {
              await bot.sendMessage(
                chatId,
                "⚠️ Debes ingresar un valor. Ejemplo: `/chile 1050`"
              );
              return new Response("ok", { status: 200 });
            }

            const valor = valores[0];
            const processedImageUrlChile = await createImageWithRatesChileQuery(
              valor,
              chileRates
            );
            await bot.sendPhoto(chatId, processedImageUrlChile, {
              caption: "✅ Speed - Envíos desde Chile a",
            });
          }

          return new Response("ok", { status: 200 });
        }

        // CUARTO: Si no es ninguna de las opciones anteriores, mostrar mensaje de ayuda
        await bot.sendMessage(
          chatId,
          `👋 ¡Hola! Soy tu asistente de tasas de cambio.  
Puedes usarme de las siguientes formas:

📸 *Enviar imagen*  
   Sube una foto con las tasas y yo la procesaré automáticamente.  

🌍 *Usar comandos por país*  
   Ejemplos:
   • \`/chile 1050\` o \`/cl 1050\` → Actualiza la tasa de Chile a 🇺🇸 USA.
   Otros ejemplos:
   • \`/usa 56\` o \`/us 56\`
   ========================================================================================
   • \`/vzla 1060 70\` o \`/venezuela 1060 70\` → Actualiza las tasas de Envíos a 🇻🇪 Venezuela
   • \`/vzla 1060,70\` o \`/venezuela 1060,70\` (🇨🇴 Colombia = 70 | 🇺🇸 USA = 1060).  
      
    Puedes ingresar más de 2 valores y tomaré los menores y mayores automáticamente.
    *IMPORTANTE*
    No ingreses en la tasa colombia una "," Siempre ingresa un punto "."
    Ejemplo: 22.55
      `,
          { ...keyboard, parse_mode: "Markdown" }
        );
      } catch (err) {
        console.error("Error procesando mensaje de texto:", err);
        await bot.sendMessage(
          chatId,
          "⚠️ Ocurrió un error procesando tu tasa. Intenta de nuevo.",
          keyboard
        );
      }
      return new Response("ok", { status: 200 });
    }

    if (
      !ecuadorRates &&
      !mexicoRates &&
      !venezuelaRates &&
      !peruRates &&
      !chileRates &&
      !argentinaRates &&
      !brasilRates &&
      !colombiaRates
    ) {
      await bot.sendMessage(chatId, "No encontré tasas", keyboard);
      return new Response("ok", { status: 200 });
    }

    // Manejo de imágenes
    if (body.message?.photo) {
      try {
        await bot.sendMessage(
          chatId,
          "⏳ Procesando imagen... Por favor espera."
        );
        const fileId = body.message.photo.pop().file_id;
        const fileUrl = await getFileUrl(fileId);
        const imageBuffer = await downloadImageFromTelegram(fileUrl);
        const cloudinaryUrl = await uploadToCloudinary(imageBuffer);
        const res = await fetch(`https://remesas-top-tasas.vercel.app/api/ocr`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: cloudinaryUrl }),
        });

        if (!res.ok) {
          throw new Error(`OCR API error: ${res.status}`);
        }
        const data = await res.json();
        const otrosTextos = data.tasasValidadas?.otros_textos || [];

        const texto = otrosTextos.join(" ");

        const esEnvioChile = /ENV[IÍ]O DESDE CHILE/i.test(texto);
        const esUsuarioPlus = /@Plusremesas/.test(texto);

        if (esEnvioChile && esUsuarioPlus) {
          const processedImageUrlChile = await createImageWithRatesChile(
            data.tasasValidadas,
            chileRates
          );
          await bot.sendPhoto(chatId, processedImageUrlChile, {
            caption: "✅ Tasas de cambio actualizadas. Envíos desde Chile a",
          });
        } else {
          const processedImageUrl = await createImageWithRates(
            data.tasasValidadas,
            paisesAVenezuela
          );
          await bot.sendPhoto(chatId, processedImageUrl, {
            caption:
              "✅ Tasas de cambio actualizadas. Envíos a Venezuela desde",
          });
        }
      } catch (err) {
        console.error("Error procesando imagen:", err);
        await bot.sendMessage(
          chatId,
          "⚠️ Ocurrió un error procesando tu imagen. Por favor intenta de nuevo.",
          keyboard
        );
      }

      return new Response("ok", { status: 200 });
    }

    return new Response("ok", { status: 200 });
  } catch (err) {
    console.error("Bot error general:", err);
    try {
      const body = await req.json();
      const chatId = body.message?.chat?.id;
      if (chatId) {
        const keyboard = {
          reply_markup: {
            keyboard: [[{ text: "⚡ Generar Tasas Speed" }]],
            resize_keyboard: true,
            one_time_keyboard: false,
          },
        };
        await bot.sendMessage(
          chatId,
          "⚠️ Hubo un error inesperado. Intenta más tarde.",
          keyboard
        );
      }
    } catch (e) {
      console.error("Error extra al notificar:", e);
    }
    return new Response("ok", { status: 200 });
  }
}

async function getFileUrl(fileId) {
  const res = await fetch(
    `https://api.telegram.org/bot${token}/getFile?file_id=${fileId}`
  );
  const data = await res.json();
  const filePath = data?.result?.file_path;
  if (!filePath) throw new Error("Failed to get file path from Telegram API.");
  return `https://api.telegram.org/file/bot${token}/${filePath}`;
}

async function downloadImageFromTelegram(fileUrl) {
  const response = await fetch(fileUrl);
  if (!response.ok)
    throw new Error(`Error downloading image: ${response.status}`);
  return Buffer.from(await response.arrayBuffer());
}

async function uploadToCloudinary(imageBuffer) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.v2.uploader.upload_stream(
      {
        folder: "telegram_bot_images",
        resource_type: "image",
        format: "jpg",
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result.secure_url);
      }
    );
    stream.end(imageBuffer);
  });
}

