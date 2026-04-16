import { Request, Response, NextFunction } from 'express';
import { HealthService } from '../Services/healthService';
import { sendSuccess } from '../Utils/responseHelper';

/**
 * Health check controller.
 * Per backend-rules.md: Controllers handle HTTP req/res only — no business logic, no DB queries.
 */
const healthService = new HealthService();

export const getHealth = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const data = healthService.getHealthStatus();
    sendSuccess(res, data, 'Sunucu sağlıklı çalışıyor.');
  } catch (error) {
    next(error);
  }
};

export const getHelloWorld = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const data = healthService.getHelloWorld();
    sendSuccess(res, data, 'Merhaba Dünya!');
  } catch (error) {
    next(error);
  }
};
