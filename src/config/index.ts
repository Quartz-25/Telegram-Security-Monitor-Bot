import dotenv from 'dotenv';
import path from 'path';
import { cleanEnv, num, str } from 'envalid';

const files = ['.env'];

files.forEach((p) => {
  dotenv.config({
    path: `${path.resolve(__dirname, '../..')}/${p}`,
    override: true,
  });
});

// validate env
const envData = cleanEnv(process.env, {
  PORT: num({ default: 4848 }),

  RABBITMQ_URL: str(),
  RABBITMQ_SIGN: str(),
  RABBITMQ_TOKEN: str(),
  RABBITMQ_SERVICE: str(),

  BOT_TOKEN: str(),
  ALERT_CHAT_ID: num(),
});

export default {
  server: {
    port: envData.PORT,
  },
  event: {
    url: envData.RABBITMQ_URL,
    sign: envData.RABBITMQ_SIGN,
    token: envData.RABBITMQ_TOKEN,
    service: envData.RABBITMQ_SERVICE
  },
  bot: {
    token: envData.BOT_TOKEN,
    chatId: envData.ALERT_CHAT_ID
  },
};
