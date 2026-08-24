import swaggerJsdoc from 'swagger-jsdoc';
import { env } from './env';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: env.APP_NAME,
      version: '1.0.0',
      description: 'My Store Management API',
    },
    servers: [{ url: `http://localhost:${env.PORT}${env.API_PREFIX}` }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ['./src/**/*.routes.ts', './src/**/*.swagger.ts', './src/config/swagger.docs.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);
