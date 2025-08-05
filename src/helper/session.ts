import { CTX } from 'types/bot.type';
import loggerBot from './logger.bot';

type SessionDataField = keyof CTX['session'];

/**
 * Saving data to the session
 * @param ctx - telegram context
 * @param field - field to store in
 * @param data - data to store
 */
export function saveToSession(ctx: CTX, field: SessionDataField, data: any) {
  loggerBot.debug(ctx, 'Saving %s to session', field);
  ctx.session[field] = data as unknown as never;
}

/**
 * Removing data from the session
 * @param ctx - telegram context
 * @param field - field to delete
 */
export function deleteFromSession(ctx: CTX, field: SessionDataField) {
  loggerBot.debug(ctx, 'Deleting %s from session', field);
  delete ctx.session[field];
}
