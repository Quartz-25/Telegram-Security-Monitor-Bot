import { MainConsumers } from 'enums/event.enum';
import channel from './channel';
import config from 'config';
import logger from 'helper/logging';
import { bot } from 'config/bot';
import { Model } from 'types/model';
import { getIpCountry } from 'helper/ipGeo';
import dateTime from 'helper/dateTime';

const CHAT_ID = config.bot.chatId;

const start = async () => {
  if (!channel.consume) {
    logger.warn('RabbitMQ consume channel not ready. Retrying in 1 second...');
    setTimeout(() => {
      start();
    }, 1000);
    return;
  }

  Object.values(MainConsumers).forEach(async (queue: MainConsumers) => {
    if (channel.consume) {
      await channel.consume.assertExchange(queue, 'fanout', {
        durable: false,
      });

      const q = await channel.consume.assertQueue(
        `${config.event.service}_${queue}`,
        {
          exclusive: false,
          durable: false,
          deadLetterExchange: 'dlx_exchange',
        }
      );

      channel.consume.bindQueue(q.queue, queue, '');
      channel.consume.consume(q.queue, (message) => {
        if (message) {
          channel.consume?.ack(message);

          try {
            const data = JSON.parse(message.content.toString());

            if (
              data.signature === config.event.sign &&
              data.service === config.event.service
            ) {
              handleMessage(queue, data.data);
            }
          } catch (error) {
            logger.error(`consumer parse message: ${error}`);
          }
        }
      });
    } else {
      logger.error(`Failed to assert or consume for queue ${queue}: channel.consume is null.`);
    }
  });

  const IP_BLOCK_EXCHANGE_NAME = 'ip_block_exchange';
  const IP_BLOCK_QUEUE_NAME = 'blocked_ips_queue';
  const IP_BLOCK_ROUTING_KEY = 'ip.blocked';

  if (channel.consume) {
    await channel.consume.assertExchange(IP_BLOCK_EXCHANGE_NAME, 'direct', { durable: true });
    await channel.consume.assertQueue(IP_BLOCK_QUEUE_NAME, { durable: true });
    await channel.consume.bindQueue(IP_BLOCK_QUEUE_NAME, IP_BLOCK_EXCHANGE_NAME, IP_BLOCK_ROUTING_KEY);

    channel.consume.consume(IP_BLOCK_QUEUE_NAME, async (message) => {
      if (message) {
        try {
          const data = JSON.parse(message.content.toString());
          await handleMessage(MainConsumers.blocked_ip, data);
          channel.consume?.ack(message);
        } catch (error) {
          logger.error(`IP block consumer parse message or handle error: ${error}`);
          channel.consume?.nack(message);
        }
      }
    }, { noAck: false });
    logger.info(`Listening for IP block notifications on queue: ${IP_BLOCK_QUEUE_NAME}`);
  } else {
    logger.error('Cannot start IP block consumer: channel.consume is null.');
  }

  const INVALID_REQUEST_EXCHANGE_NAME = 'invalid_request_exchange';
  const INVALID_REQUEST_QUEUE_NAME = 'invalid_requests_queue';
  const INVALID_REQUEST_ROUTING_KEY = 'invalid.request.detected';

  if (channel.consume) {
    await channel.consume.assertExchange(INVALID_REQUEST_EXCHANGE_NAME, 'direct', { durable: true });
    await channel.consume.assertQueue(INVALID_REQUEST_QUEUE_NAME, { durable: true });
    await channel.consume.bindQueue(INVALID_REQUEST_QUEUE_NAME, INVALID_REQUEST_EXCHANGE_NAME, INVALID_REQUEST_ROUTING_KEY);

    channel.consume.consume(INVALID_REQUEST_QUEUE_NAME, async (message) => {
      if (message) {
        try {
          const data = JSON.parse(message.content.toString());
          await handleMessage(MainConsumers.invalid_request, data);
          channel.consume?.ack(message);
        } catch (error) {
          logger.error(`Invalid request consumer parse message or handle error: ${error}`);
          channel.consume?.nack(message);
        }
      }
    }, { noAck: false });
    logger.info(`Listening for invalid request notifications on queue: ${INVALID_REQUEST_QUEUE_NAME}`);
  } else {
    logger.error('Cannot start invalid request consumer: channel.consume is null.');
  }
};

const handleMessage = async (queue: MainConsumers, data: any) => {
  console.log('new queue message <=====> ', queue);
  try {
    if (queue === MainConsumers.blocked_ip) {
      await blockedMsg(data)
    } else if (queue === MainConsumers.invalid_request) {
      await invalidReqMsg(data)
    }
  } catch (error) {
    logger.error(`consumer handleMessage error: ${error}`);
  }
};

const blockedMsg = async (data: Model.BlockedIP) => {
  try {
    if (!CHAT_ID) {
      logger.error('TELEGRAM_CHAT_ID is not set. Cannot send IP block notification.');
      return;
    }

    const ipCountry = await getIpCountry(data.ipAddress)

    await bot.telegram.sendMessage(CHAT_ID,
      `🚨 <b>IP Blocking Alert!</b> 🚨\n\n` +
      `<b>IP address:</b>     <tg-spoiler>${data.ipAddress} | ${ipCountry}</tg-spoiler>\n` +
      `<b>Reason:</b>     <i>${data.reason}</i>\n` +
      `<b>Time:</b>     ${dateTime(data.timestamp).format('YYYY/MM/DD | HH:mm:ss')}\n`,

      { parse_mode: 'HTML' }
    )
  } catch (error) {
    logger.error(`consumer handleMessage error: ${error}`);
  }
};

const invalidReqMsg = async (data: Model.InvalidRequest) => {
  try {
    if (!CHAT_ID) {
      logger.error('TELEGRAM_CHAT_ID is not set. Cannot send invalid request notification.');
      return;
    }

    const ipCountry = await getIpCountry(data.requestInfo.sender.ip)

    const blockStatusText = data.isIpBlocked ? 'Yes (blocked)' : 'No (not blocked)';

    await bot.telegram.sendMessage(CHAT_ID,
      `⚠️ <b>${data.eventType}</b> ⚠️\n\n` +
      `<b>Is the IP currently blocked?</b>     ${blockStatusText}\n\n` +
      `<b>Request Info:</b>     <blockquote>${`\n` +
      `<b>Method:</b>     <b>${data.requestInfo.method}</b>\n` +
      `<b>Requested URL:</b>     ${data.requestInfo.route}\n` +
      `<b>Status Code:</b>     <b>${data.requestInfo.statusCode}</b>\n` +
      `<b>Status Message:</b>     <s>${data.requestInfo.statusMessage || 'Null'}</s>\n` +
      `<b>Time:</b>     ${data.requestInfo.time}\n` +
      `\n`}</blockquote>\n\n` +
      `<b>Sender Info:</b>     <blockquote>${`\n` +
      `<b>IP Address:</b>     <b>${data.requestInfo.sender.ip} | ${ipCountry}</b>\n` +
      `<b>Port:</b>     <b>${data.requestInfo.sender.port || 'Null'}</b>\n` +
      `<b>Device:</b>     ${data.requestInfo.sender.device}\n` +
      `<b>Protocol:</b>     <s>${data.requestInfo.sender.protocol}</s>\n` +
      `<b>Hostname:</b>     <s>${data.requestInfo.sender.hostname}</s>\n` +
      `<b>Referer:</b>     ${data.requestInfo.sender.referer || 'Null'}\n` +
      `<b>Authorization:</b>     ${data.requestInfo.sender.authenticatedUserId || 'Null'}\n` +
      `\n`}</blockquote>\n\n` +
      `<b>Request Details:</b>     <blockquote>${`\n \n` +
      `<b>Query Parameters:</b>     ${JSON.stringify(data.requestInfo.requestDetails.queryParameters) || 'Null'}\n\n` +
      `<b>Route Parameters:</b>     ${JSON.stringify(data.requestInfo.requestDetails.routeParameters) || 'Null'}\n\n` +
      `<b>Body Size:</b>     ${JSON.stringify(data.requestInfo.requestDetails.bodySize) || 'Null'}\n\n` +
      `<b>Headers:</b>     ${JSON.stringify(data.requestInfo.requestDetails.headers) || 'Null'}\n\n` +
      ` \n`}</blockquote>\n\n` +
      `<b>User Agent:</b>     <blockquote>${data.requestInfo.sender.userAgentRaw}</blockquote>\n\n` +
      `<b>Timestamp:</b>     <b>${dateTime(data.timestamp).format('YYYY/MM/DD | HH:mm:ss')}</b>\n`,
      { parse_mode: 'HTML' }
    )
  } catch (error) {
    logger.error(`consumer handleMessage error: ${error}`);
  }
};

export default {
  start,
};
