import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';
import { generateTimestamp } from '../Utils/generateTimestamp';

/**
 * Zod-based request validation middleware.
 * Per backend-rules.md: All body, query, params MUST be validated via Zod before reaching Controller.
 */
export const validateRequest =
  (schema: AnyZodObject) =>
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(422).json({
          success: false,
          data: error.errors,
          message: 'Validasyon hatası. Lütfen gönderilen verileri kontrol edin.',
          timestamp: generateTimestamp(),
        });
        return;
      }
      next(error);
    }
  };
