import http from 'http';
import { execSync } from 'child_process';
import { createApp } from './app';
import { env } from './config/env';
import { logger } from './config/logger';
import { initSocket } from './socket/socket';

async function bootstrap() {
  try {
    logger.info('Running database migrations...');
    execSync('npx prisma migrate deploy', { stdio: 'inherit' });
    logger.info('Migrations applied successfully');

    logger.info('Seeding database...');
    execSync('npx prisma db seed', { stdio: 'inherit' });
    logger.info('Database seeded successfully');
  } catch (err) {
    logger.error('Migration/seed failed', err);
  }

  const app = createApp();
  const server = http.createServer(app);

  initSocket(server);

  server.listen(env.PORT, () => {
    logger.info(`${env.APP_NAME} running on port ${env.PORT}`);
    logger.info(`Swagger docs: http://localhost:${env.PORT}/docs`);
    logger.info(`API base: http://localhost:${env.PORT}${env.API_PREFIX}`);
  });
}

bootstrap();

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled rejection', reason);
});

process.on('uncaughtException', (err) => {
  logger.error('Uncaught exception', err);
  process.exit(1);
});
