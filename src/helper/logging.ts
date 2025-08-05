import pino from 'pino';
import dateTime from './dateTime';
import fs from 'fs';

const dir = `${process.cwd()}/logs`;

if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

const transport = pino.transport({
  targets: [
    {
      target: 'pino/file',
      options: { destination: `${process.cwd()}/logs/app.log` },
      level: 'info',
    },
    {
      target: 'pino-pretty',
      options: {
        colorize: true,
      },
      level: 'info',
    },
  ],
});

const logger = pino(
  {
    level: 'info',
    formatters: {
      bindings: (bindings) => {
        return {
          pid: bindings.pid,
        };
      },
    },

    timestamp: () =>
      `,"timestamp":"${dateTime.utc().format('YYYY-MM-DD HH:mm:ss')}"`,
  },
  transport
);

export default logger;
