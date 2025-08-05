import { Telegraf } from 'telegraf';
import TelegrafI18n from 'telegraf-i18n';
import config from 'config';
import { CTX } from 'types/bot.type';

const bot = new Telegraf<CTX>(config.bot.token).catch((err) => {
  console.error(err);
});

const i18n = new TelegrafI18n({
  defaultLanguage: 'en',
  directory: __dirname + '/../locale',
  useSession: true,
  allowMissing: false,
  sessionName: 'session',
});

export { bot, i18n };
