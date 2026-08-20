import TelegramBot from 'node-telegram-bot-api';
import 'dotenv/config';

const token = process.env.TELEGRAM_BOT_TOKEN || '8161791405:AAEO_zPHueSw1GSAqhr7f-Tey9ei1JCSMMg';
const bot = new TelegramBot(token);
const webhookUrl = 'https://29de-216-105-168-26.ngrok-free.app/api/bot';

bot.setWebHook(webhookUrl)
  .then(() => console.log('✅ Webhook configurado en:', webhookUrl))
  .catch(console.error);

bot.getWebHookInfo()
  .then(info => console.log('ℹ️ Info del webhook:', info))
  .catch(console.error);