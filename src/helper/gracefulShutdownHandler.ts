import logging from './logging';

const gracefulShutdownHandler = () => {
  logging.info('Graceful shutdown start');
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  return (code: number, reason: string) => (err: Error, _promise: unknown) => {
    if (err && err instanceof Error) {
      logging.error(
        `Server is down with code: ${code}, 
        reason: ${reason}.error,
        name: ${err.name},
        message : ${err.message},
        stack : ${err.stack}`
      );
    }
    process.exit(0);
  };
};

export default gracefulShutdownHandler;
