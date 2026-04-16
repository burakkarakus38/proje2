import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { v4 as uuidv4 } from 'uuid';
import * as swaggerUi from 'swagger-ui-express';

import { config } from './Config';
import { swaggerSpec } from './Config/swagger';
import routes from './Routes';
import { globalErrorHandler } from './Middlewares/errorHandler';
import { AppError } from './Utils/AppError';
import { Logger } from './Utils/logger';

const app = express();

// ── Request ID & Logging Middleware ──────────────────────────
// Add unique request ID for tracing and logging
app.use((req: Request, res: Response, next: NextFunction) => {
  const requestId = uuidv4();
  req.id = requestId;
  res.setHeader('X-Request-ID', requestId);

  const requestStart = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - requestStart;
    Logger.info(`[${requestId}] ${req.method} ${req.path}`, {
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      userId: (req as any).userId,
    });
  });
  next();
});

// ── Security Middlewares ─────────────────────────────────────
// Helmet: Set security HTTP headers (HSTS, XSS, CSP, etc)
app.use(helmet());

// Rate Limiting: Prevent brute force & DDoS attacks
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs
  message: 'Çok fazla istek gönderdiniz. Lütfen daha sonra tekrar deneyin.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting to all routes
app.use(limiter);

// Auth endpoints: stricter rate limiting
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50, // 50 attempts per 15 minutes (relaxed for development)
  message: 'Çok fazla giriş denemesi. 15 dakika sonra tekrar deneyin.',
  skipSuccessfulRequests: true, // Don't count successful requests
});

// ── Core Middlewares ──────────────────────────────────────────
app.use(cors({ origin: config.cors.origin }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Swagger UI (/api-docs) ───────────────────────────────────
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// ── API Routes (Versioned) ───────────────────────────────────
// Version v1 routes with stricter auth rate limiting
app.use('/api/v1/auth', authLimiter);
app.use('/api/v1', routes);
// Also support non-versioned for backward compatibility (during transition)
app.use('/api', routes);

// ── 404 Handler (tanımsız route'lar) ─────────────────────────
app.all('*', (req, _res, next) => {
  next(new AppError(`${req.method} ${req.originalUrl} yolu bulunamadı.`, 404));
});

// ── Global Error Handler (en son eklenmeli) ──────────────────
app.use(globalErrorHandler);

export default app;
