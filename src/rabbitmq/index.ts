import amqplib from 'amqplib';
import config from 'config';
import logger from 'helper/logging';
import channel from './channel';
import consumers from './consumers';

const connect = async () => {
  amqplib
    .connect(config.event.url)
    .then(async (conn: any) => {
      logger.info('event connected');

      channel.publish = await conn.createConfirmChannel();
      channel.consume = await conn.createChannel();
      channel.consume?.prefetch(1);

      await channel.publish?.assertExchange('dlx_exchange', 'direct', {
        durable: true,
      });
      await channel.publish?.assertQueue('dlq', { durable: true });
      await channel.publish?.bindQueue('dlq', 'dlx_exchange', 'task_queue');

      consumers.start();

      conn.on('close', () => {
        logger.warn('event closed');

        if (channel.publish) {
          try { channel.publish.close(); } catch (e) { logger.error("Error closing publish channel on close:", e); }
          channel.publish = null;
        }
        if (channel.consume) {
          try { channel.consume.close(); } catch (e) { logger.error("Error closing consume channel on close:", e); }
          channel.consume = null;
        }

        setTimeout(() => {
          connect();
        }, 1000);
      });

      conn.on('error', (err: Error) => {
        logger.error(`event connection error: ${err.message}`);
        if (channel.publish) {
          try { channel.publish.close(); } catch (e) { logger.error("Error closing publish channel on error:", e); }
          channel.publish = null;
        }
        if (channel.consume) {
          try { channel.consume.close(); } catch (e) { logger.error("Error closing consume channel on error:", e); }
          channel.consume = null;
        }
        conn.close().catch((e: any) => logger.error("Error closing connection on error:", e));
        setTimeout(() => {
          connect();
        }, 1000);
      });

      channel.publish?.on('error', (err: Error) => {
        logger.error(`event publish channel error: ${err.message}`);
        conn.close().catch((e: any) => logger.error("Error closing connection on publish channel error:", e));
      });
      channel.consume?.on('error', (err: Error) => {
        logger.error(`event consume channel error: ${err.message}`);
        conn.close().catch((e: any) => logger.error("Error closing connection on consume channel error:", e));
      });

    })
    .catch((error: any) => {
      logger.error(`event queue connection failed: ${error}`);

      setTimeout(() => {
        connect();
      }, 1000);
    });
};

export default {
  connect,
};
