import jwt from 'jsonwebtoken';
import { config } from '../Config';

/**
 * JWT Token Utilities
 * Per backend-rules.md:
 *   - Access Token: Short-lived (15 minutes)
 *   - Refresh Token: Long-lived (7 days) and stored in database
 */

export interface TokenPayload {
  userId: string | number;
  email?: string;
  role?: string;
}

/**
 * Generate Access Token (short-lived)
 */
export const generateAccessToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, config.jwt.accessSecret, {
    expiresIn: config.jwt.accessExpiresIn as any,
  });
};

/**
 * Generate Refresh Token (long-lived)
 */
export const generateRefreshToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpiresIn as any,
  });
};

/**
 * Verify Access Token
 */
export const verifyAccessToken = (token: string): TokenPayload => {
  return jwt.verify(token, config.jwt.accessSecret) as TokenPayload;
};

/**
 * Verify Refresh Token
 */
export const verifyRefreshToken = (token: string): TokenPayload => {
  return jwt.verify(token, config.jwt.refreshSecret) as TokenPayload;
};

/**
 * Decode token without verification (for checking expiration, etc.)
 */
export const decodeToken = (token: string): jwt.JwtPayload | null => {
  return jwt.decode(token) as jwt.JwtPayload | null;
};
