import { Request, Response, NextFunction } from 'express';
import { AppError } from '../Utils/AppError';
import { generateTimestamp } from '../Utils/generateTimestamp';
import { Logger } from '../Utils/logger';

/**
 * Global Exception Handler middleware.
 * Per backend-rules.md:
 *   - Stack traces are NEVER sent to client
 *   - Stack traces are logged server-side only
 *   - AppError instances return their specific statusCode and message
 *   - Unknown errors return generic 500 message
 * Must be registered LAST in Express middleware chain.
 */
export const globalErrorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // Server-side logging (stack visible here, never sent to client)
  Logger.error(`[ERROR] ${req.method} ${req.path}`, err, {
    url: req.path,
    method: req.method,
  });

  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      data: null,
      message: err.message,
      timestamp: generateTimestamp(),
    });
    return;
  }

  // Unexpected errors — user-friendly message only
  res.status(500).json({
    success: false,
    data: null,
    message: 'Sunucuda beklenmedik bir hata oluştu. Lütfen daha sonra tekrar deneyin.',
    timestamp: generateTimestamp(),
  });
};
