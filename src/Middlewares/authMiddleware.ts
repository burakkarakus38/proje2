import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../Config';
import { AppError } from '../Utils/AppError';
import { Logger } from '../Utils/logger';
import { JwtPayload } from '../types';

/**
 * JWT Authentication Middleware
 * Per backend-rules.md: Protected endpoints must verify JWT tokens
 * Extracts token from Authorization header and validates it
 * Attaches user data (id, role, gsm) to request object via global Express.Request augmentation
 *
 * @see src/types/express.d.ts — Request.user tanımı
 */

export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError(
        'Kimlik doğrulama hatası: JWT token bulunamadı veya geçersiz format.',
        401
      );
    }

    const token = authHeader.substring(7); // "Bearer " kısmını çıkar
    const decoded = jwt.verify(token, config.jwt.accessSecret) as JwtPayload;

    // Attach decoded user data to request (global Express.Request augmentation)
    req.user = {
      id: decoded.userId,
      role: decoded.role,
      gsm: decoded.gsm,
      email: decoded.email,
    };

    // Legacy support — geriye dönük uyumluluk
    req.userId = decoded.userId;
    req.token = token;

    Logger.debug('Authentication successful', {
      userId: decoded.userId,
      role: decoded.role,
    });

    next();
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    if (error instanceof jwt.TokenExpiredError) {
      throw new AppError('Token süresi dolmuş. Lütfen yeniden giriş yapın.', 401);
    }
    Logger.error('Authentication error', error as Error);
    throw new AppError('Geçersiz veya eksik kimlik doğrulama tokeni.', 401);
  }
};
