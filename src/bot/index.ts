/* eslint-disable @typescript-eslint/ban-ts-comment */
import { bot, i18n } from 'config/bot';
import { session } from 'telegraf/session';
import config from 'config';
import stage from './stage';

export default async function botLoader() {
    bot.use(session());
    bot.use(i18n.middleware());
    bot.use(stage.middleware());

    bot.action(/s_/, async (ctx) => {
        const [_, type, id] = (ctx.callbackQuery as any).data.split('_');
        await ctx.editMessageReplyMarkup({ inline_keyboard: [] })

        return ctx.scene.enter('set-tokens', { type, groupId: Number(id) })
    });

    botLaunch()
}

const botLaunch = () => {
    bot
        .launch(() => {
            console.log(`[STARTED] Bot is now online!`);
        })
        .catch(() => {
            botLaunch()
            console.log('.................. bot error ..................', config.bot.token);
        }).finally(() => {
            console.log('.................. bot stop ..................');
        });
}
