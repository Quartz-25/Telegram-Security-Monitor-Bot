// import database from './app/database';
import logger from './helper/logging';
import gracefulShutdownHandler from './helper/gracefulShutdownHandler';
import botLoader from 'bot';
import rabbitmq from 'rabbitmq';

const runServer = async () => {
  // await database.connect();
  await rabbitmq.connect();
  await botLoader();

  // handle the error safely
  process.on('unhandledRejection', (err) => {
    logger.error(err, 'unhandledRejection');
  });

  // Graceful Shutdown

  const exitHandler = gracefulShutdownHandler();

  process.on('SIGTERM', exitHandler(0, 'SIGTERM'));
  process.on('SIGINT', exitHandler(0, 'SIGINT'));
};

runServer();