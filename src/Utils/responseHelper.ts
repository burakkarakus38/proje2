import { Response } from 'express';
import { generateTimestamp } from './generateTimestamp';

/**
 * Standard API response format enforced by backend-rules.md:
 * { success: boolean, data: any, message: string, timestamp: iso_date }
 */
interface StandardResponse {
  success: boolean;
  data: unknown;
  message: string;
  timestamp: string;
}

export const sendSuccess = (
  res: Response,
  data: unknown,
  message: string,
  statusCode = 200
): Response<StandardResponse> => {
  return res.status(statusCode).json({
    success: true,
    data,
    message,
    timestamp: generateTimestamp(),
  });
};

export const sendError = (
  res: Response,
  message: string,
  statusCode = 500,
  data: unknown = null
): Response<StandardResponse> => {
  return res.status(statusCode).json({
    success: false,
    data,
    message,
    timestamp: generateTimestamp(),
  });
};
