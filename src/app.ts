import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import { env } from './config/env';
import { swaggerSpec } from './config/swagger';
import { errorHandler, notFoundHandler } from './common/middleware/error.middleware';
import { uploadRoot } from './common/middleware/upload.middleware';

import authRoutes from './auth/auth.routes';
import usersRoutes from './users/users.routes';
import customersRoutes from './customers/customers.routes';
import enquiriesRoutes from './enquiries/enquiries.routes';
import devicesRoutes from './devices/devices.routes';
import stagesRoutes from './stages/stages.routes';
import serviceJobsRoutes from './service-jobs/service-jobs.routes';
import paymentsRoutes from './payments/payments.routes';
import attachmentsRoutes from './attachments/attachments.routes';
import notificationsRoutes from './notifications/notifications.routes';

export function createApp() {
  const app = express();

  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.use(
    cors({
      origin: env.CORS_ORIGIN === '*' ? true : env.CORS_ORIGIN.split(','),
      credentials: true,
    }),
  );
  app.use(compression());
  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));

  app.use(
    rateLimit({
      windowMs: env.RATE_LIMIT_WINDOW_MS,
      max: env.RATE_LIMIT_MAX,
      standardHeaders: true,
      legacyHeaders: false,
    }),
  );

  app.get('/health', (_req, res) => {
    res.json({ success: true, status: 'ok', timestamp: new Date().toISOString() });
  });

  app.use('/uploads', express.static(uploadRoot));
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  app.get('/docs.json', (_req, res) => res.json(swaggerSpec));

  const api = express.Router();
  api.use('/auth', authRoutes);
  api.use('/users', usersRoutes);
  api.use('/customers', customersRoutes);
  api.use('/enquiries', enquiriesRoutes);
  api.use('/devices', devicesRoutes);
  api.use('/stages', stagesRoutes);
  api.use('/jobs', serviceJobsRoutes);
  api.use('/payments', paymentsRoutes);
  api.use('/attachments', attachmentsRoutes);
  api.use('/notifications', notificationsRoutes);

  app.use(env.API_PREFIX, api);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
