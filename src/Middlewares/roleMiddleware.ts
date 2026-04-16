import { Request, Response, NextFunction } from 'express';
import { AppError } from '../Utils/AppError';
import { Logger } from '../Utils/logger';

/**
 * Role-Based Authorization Middleware
 * Per backend-rules.md: Yetki gerektiren işlemlerde 403 Forbidden döndür
 * Global Express.Request augmentation üzerinden req.user kullanır.
 *
 * @see src/types/express.d.ts — Request.user tanımı
 *
 * Usage: router.post('/admin-route', authMiddleware, checkRole(['ADMIN']), handler)
 *        router.put('/provider-route', authMiddleware, checkRole(['ADMIN', 'PROVIDER']), handler)
 */

/**
 * Check if user has one of the allowed roles
 * @param allowedRoles Array of role strings that are permitted (e.g., ['ADMIN', 'PROVIDER'])
 * @returns Middleware function that validates user role
 */
export const checkRole = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      // Verify user object exists (should be set by authMiddleware)
      if (!req.user) {
        throw new AppError(
          'Kimlik doğrulama hatası: Kullanıcı bilgisi bulunamadı.',
          401
        );
      }

      // Verify user has a role
      if (!req.user.role) {
        throw new AppError(
          'Yetkilendirme hatası: Kullanıcı rolü atanmamış.',
          403
        );
      }

      // Check if user's role is in the allowed roles list
      if (!allowedRoles.includes(req.user.role)) {
        Logger.warn('Unauthorized role access attempt', {
          userId: req.user.id,
          userRole: req.user.role,
          requiredRoles: allowedRoles,
        });

        throw new AppError(
          'Bu işlem için yetkiniz yeterli değil. Lütfen istediğiniz işlem için gerekli yetkiye sahip olduğunuzu kontrol edin.',
          403
        );
      }

      Logger.debug('Role authorization successful', {
        userId: req.user.id,
        userRole: req.user.role,
      });

      next();
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      Logger.error('Error in role middleware', error as Error);
      throw new AppError(
        'Yetkilendirme kontrolü sırasında hata oluştu.',
        500
      );
    }
  };
};

/**
 * Convenience middleware for admin-only access
 * Usage: router.delete('/admin-route', authMiddleware, requireAdmin, handler)
 */
export const requireAdmin = checkRole(['ADMIN']);

/**
 * Convenience middleware for provider-only access
 * Usage: router.post('/provider-route', authMiddleware, requireProvider, handler)
 */
export const requireProvider = checkRole(['PROVIDER']);

/**
 * Convenience middleware for authenticated users (any role)
 * Usage: router.get('/user-route', authMiddleware, requireAuth, handler)
 * Note: authMiddleware itself provides minimal auth, this is for clarity
 */
export const requireAuth = checkRole(['ADMIN', 'USER', 'PROVIDER']);
