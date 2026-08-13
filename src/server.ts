import http from 'http';
import { createApp } from './app';
import { env } from './config/env';
import { logger } from './config/logger';
import { initSocket } from './socket/socket';

const app = createApp();
const server = http.createServer(app);

initSocket(server);

server.listen(env.PORT, () => {
  logger.info(`${env.APP_NAME} running on port ${env.PORT}`);
  logger.info(`Swagger docs: http://localhost:${env.PORT}/docs`);
  logger.info(`API base: http://localhost:${env.PORT}${env.API_PREFIX}`);
});

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled rejection', reason);
});

process.on('uncaughtException', (err) => {
  logger.error('Uncaught exception', err);
  process.exit(1);
});
