import { Request, Response, NextFunction } from 'express';
import { ReservationService } from '../Services/reservationService';
import { sendSuccess } from '../Utils/responseHelper';

/**
 * Reservation Controller
 * Per backend-rules.md: Controllers handle HTTP req/res only — no business logic, no DB queries
 * All business logic delegated to ReservationService
 * Response format: { success: boolean, data: any, message: string, timestamp: iso_date }
 */

const reservationService = new ReservationService();

/**
 * Create reservation
 * @route POST /api/reservations
 * @middleware authMiddleware
 * @body { vehicleId, parkingLotId, startTime, endTime? | plannedDuration }
 * @returns Created reservation with calculated price
 */
export const createReservation = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { vehicleId, parkingLotId, startTime, endTime, plannedDuration } = req.body;
    const userId = req.user?.id as number;

    const result = await reservationService.createReservation({
      vehicleId,
      parkingLotId,
      userId,
      startTime: new Date(startTime),
      endTime: endTime ? new Date(endTime) : undefined,
      plannedDuration,
    });

    sendSuccess(
      res,
      result,
      'Rezervasyon başarıyla oluşturuldu.',
      201
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get reservation details
 * @route GET /api/reservations/:reservationId
 * @param reservationId Reservation ID
 * @returns Reservation details with duration and price
 */
export const getReservation = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { reservationId } = req.params as { reservationId: string };

    const result = await reservationService.getReservation(
      parseInt(String(reservationId))
    );

    if (!result) {
      void sendSuccess(res, null, 'Rezervasyon bulunamadı.', 404);
      return;
    }

    void sendSuccess(res, result, 'Rezervasyon bilgisi alındı.', 200);
  } catch (error) {
    next(error);
  }
};

/**
 * Cancel reservation
 * @route DELETE /api/reservations/:reservationId
 * @middleware authMiddleware
 * @param reservationId Reservation ID
 * @returns Success message
 */
export const cancelReservation = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { reservationId } = req.params as { reservationId: string };

    await reservationService.cancelReservation(parseInt(String(reservationId)));

    sendSuccess(
      res,
      null,
      'Rezervasyon başarıyla iptal edildi.',
      200
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get user's reservations
 * @route GET /api/reservations
 * @middleware authMiddleware
 * @query status (optional) - Filter by status: PENDING, ACTIVE, COMPLETED, CANCELLED
 * @query limit (optional) - Number of results (default: 20, max: 100)
 * @query offset (optional) - Pagination offset (default: 0)
 * @returns Array of user's reservations
 */
export const getUserReservations = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id as number;
    const { status, limit = '20', offset = '0' } = req.query;

    let results = await reservationService.getUserReservations(userId);

    // Filter by status if provided
    if (status) {
      results = results.filter((r) => r.status === status);
    }

    // Apply pagination
    const offsetNum = parseInt(String(offset)) || 0;
    const limitNum = Math.min(parseInt(String(limit)) || 20, 100);

    const paginatedResults = results.slice(offsetNum, offsetNum + limitNum);

    sendSuccess(
      res,
      {
        reservations: paginatedResults,
        total: results.length,
        limit: limitNum,
        offset: offsetNum,
      },
      paginatedResults.length > 0
        ? 'Rezervasyonlar alındı.'
        : 'Sizin henüz rezervasyonunuz yok.',
      200
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get reservation statistics
 * @route GET /api/reservations/stats
 * @middleware authMiddleware
 * @returns User's reservation statistics
 */
export const getReservationStats = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id as number;

    const results = await reservationService.getUserReservations(userId);

    const stats = {
      total: results.length,
      pending: results.filter((r) => r.status === 'PENDING').length,
      active: results.filter((r) => r.status === 'ACTIVE').length,
      completed: results.filter((r) => r.status === 'COMPLETED').length,
      cancelled: results.filter((r) => r.status === 'CANCELLED').length,
      totalSpent: results.reduce((sum, r) => sum + r.totalPrice, 0),
    };

    sendSuccess(
      res,
      stats,
      'Rezervasyon istatistikleri alındı.',
      200
    );
  } catch (error) {
    next(error);
  }
};
