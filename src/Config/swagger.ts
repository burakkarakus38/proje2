import swaggerJsdoc from 'swagger-jsdoc';
import { config } from './index';
import { Logger } from '../Utils/logger';

const swaggerDefinition: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Turkcell CodeNight 2026 API',
      version: '1.0.0',
      description: 'Turkcell CodeNight 2026 Backend API Dokümantasyonu',
    },
    servers: [
      {
        url: `http://localhost:${config.port}`,
        description: 'Development Server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        StandardResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', description: 'İşlem başarılı mı' },
            data: { description: 'Yanıt verisi', nullable: true },
            message: { type: 'string', description: 'İşlem sonuç mesajı' },
            timestamp: { type: 'string', format: 'date-time', description: 'ISO 8601 zaman damgası' },
          },
        },
      },
    },
  },
  apis: ['./src/Routes/*.ts', './src/Controllers/*.ts'],
};

export const swaggerSpec = swaggerJsdoc(swaggerDefinition);

if (swaggerDefinition.definition) {
  Logger.debug('Swagger specification generated', {
    openapi: swaggerDefinition.definition.openapi,
    title: swaggerDefinition.definition.info.title,
  });
}
