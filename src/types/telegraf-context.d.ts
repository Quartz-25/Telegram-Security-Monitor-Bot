import { I18n } from 'telegraf-i18n';
import { Context, NarrowedContext } from 'telegraf';
import { Message, Update } from 'telegraf/typings/core/types/typegram';
import { SceneContextScene } from 'telegraf/scenes';
import { MatchedMiddleware } from 'telegraf/typings/composer';
import { Network } from 'enums/general.enum';
import { RequestConfig } from 'helper/request';
import { AxiosResponse } from 'axios';

type Base = NarrowedContext<
  Context<Update>,
  {
    message: Update.New & Update.NonChannel & Message.TextMessage;
    update_id: number;
  }
>;

declare module 'telegraf' {
  interface ContextMessageUpdate extends Base {
    i18n: I18n;
    scene: SceneContextScene<any>;
    match: MatchedMiddleware;
    wizard: any;
    session: {
      language: 'en';
      groups: any[];
    };
    // callbackQuery?: CallbackQuery.DataQuery
  }
}
