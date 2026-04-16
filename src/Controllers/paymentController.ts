import { Request, Response, NextFunction } from 'express';
import { ParkingSessionService } from '../Services/parkingSessionService';
import { PaymentService } from '../Services/paymentService';
import { sendSuccess } from '../Utils/responseHelper';

/**
 * Parking Session & Payment Controller
 * Per backend-rules.md: Controllers handle HTTP req/res only — no business logic, no DB queries
 * All business logic delegated to ParkingSessionService and PaymentService
 * Response format: { success: boolean, data: any, message: string, timestamp: iso_date }
 */

const parkingSessionService = new ParkingSessionService();
const paymentService = new PaymentService();

// ==================== PAYCELL PAYMENT ENDPOINT ====================

/**
 * Initiate Paycell payment for a reservation
 * @route POST /api/payments/paycell
 * @middleware authMiddleware
 * @body { reservationId, msisdn }
 * @returns Payment result with transaction details
 */
export const initiatePaycellPayment = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { reservationId, msisdn } = req.body;
    const userId = req.user?.id as number;

    const result = await paymentService.initiatePaycellPayment(
      reservationId,
      userId,
      msisdn
    );

    sendSuccess(
      res,
      result,
      'Paycell mobil ödeme başarıyla tamamlandı.',
      200
    );
  } catch (error) {
    next(error);
  }
};

// ==================== PARKING SESSION ENDPOINTS ====================

/**
 * Record vehicle entry
 * @route POST /api/parking-sessions/entry
 * @middleware authMiddleware
 * @body { reservationId, vehicleId, parkingLotId }
 * @returns Created parking session with entry time
 */
export const recordEntry = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { reservationId, vehicleId, parkingLotId } = req.body;
    const userId = req.user?.id as number;

    const result = await parkingSessionService.recordEntry({
      reservationId,
      vehicleId,
      parkingLotId,
      userId,
    });

    sendSuccess(
      res,
      result,
      'Araç başarıyla otoparka kaydedildi.',
      201
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Record vehicle exit
 * @route POST /api/parking-sessions/:parkingSessionId/exit
 * @middleware authMiddleware
 * @param parkingSessionId Parking session ID
 * @body { paymentMethod }
 * @returns Session details with charges and payment info
 */
export const recordExit = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { parkingSessionId } = req.params as { parkingSessionId: string };
    const { paymentMethod } = req.body;

    const result = await parkingSessionService.recordExit({
      parkingSessionId: parseInt(String(parkingSessionId)),
      paymentMethod,
    });

    sendSuccess(
      res,
      result,
      'Araç çıkışı başarıyla kaydedildi, ödeme işlemi başlatıldı.',
      200
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get parking session details
 * @route GET /api/parking-sessions/:parkingSessionId
 * @param parkingSessionId Parking session ID
 * @returns Parking session details with duration
 */
export const getSessionDetails = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { parkingSessionId } = req.params as { parkingSessionId: string };

    const result = await parkingSessionService.getSessionDetails(
      parseInt(String(parkingSessionId))
    );

    if (!result) {
      sendSuccess(res, null, 'Park oturumu bulunamadı.', 404);
      return;
    }

    void sendSuccess(res, result, 'Park oturumu bilgisi alındı.', 200);
  } catch (error) {
    next(error);
  }
};

/**
 * Get active session for vehicle
 * @route GET /api/parking-sessions/vehicle/:vehicleId/active
 * @param vehicleId Vehicle ID
 * @returns Active parking session or null if no active session
 */
export const getActiveSession = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { vehicleId } = req.params as { vehicleId: string };

    const result = await parkingSessionService.getActiveSession(
      parseInt(String(vehicleId))
    );

    if (!result) {
      sendSuccess(
        res,
        null,
        'Bu araç için aktif oturum bulunmuyor.',
        200
      );
      return;
    }

    sendSuccess(res, result, 'Aktif park oturumu bulundu.', 200);
  } catch (error) {
    next(error);
  }
};

/**
 * Get user's parking sessions
 * @route GET /api/parking-sessions
 * @middleware authMiddleware
 * @query limit (optional) - Number of results (default: 20, max: 100)
 * @query offset (optional) - Pagination offset (default: 0)
 * @returns Array of user's parking sessions
 */
export const getUserSessions = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id as number;
    const { limit = '20', offset = '0' } = req.query;

    const results = await parkingSessionService.getUserSessions(userId);

    const offsetNum = parseInt(String(offset)) || 0;
    const limitNum = Math.min(parseInt(String(limit)) || 20, 100);

    const paginatedResults = results.slice(offsetNum, offsetNum + limitNum);

    sendSuccess(
      res,
      {
        sessions: paginatedResults,
        total: results.length,
        limit: limitNum,
        offset: offsetNum,
      },
      paginatedResults.length > 0
        ? 'Park oturumları alındı.'
        : 'Sizin henüz park oturumunuz yok.',
      200
    );
  } catch (error) {
    next(error);
  }
};

// ==================== PAYMENT ENDPOINTS ====================

/**
 * Process payment
 * @route POST /api/payments/:paymentId/process
 * @middleware authMiddleware
 * @param paymentId Payment ID
 * @body { transactionId? }
 * @returns Updated payment details
 */
export const processPayment = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { paymentId } = req.params as { paymentId: string };
    const { transactionId } = req.body;

    const result = await paymentService.processPayment(
      parseInt(String(paymentId)),
      transactionId
    );

    sendSuccess(
      res,
      result,
      'Ödeme başarıyla işlendi.',
      200
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get payment details
 * @route GET /api/payments/:paymentId
 * @param paymentId Payment ID
 * @returns Payment details
 */
export const getPayment = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { paymentId } = req.params as { paymentId: string };

    const result = await paymentService.getPayment(parseInt(String(paymentId)));

    if (!result) {
      sendSuccess(res, null, 'Ödeme kaydı bulunamadı.', 404);
      return;
    }

    sendSuccess(res, result, 'Ödeme bilgisi alındı.', 200);
  } catch (error) {
    next(error);
  }
};

/**
 * Get user's payments
 * @route GET /api/payments
 * @middleware authMiddleware
 * @query limit (optional) - Number of results (default: 20, max: 100)
 * @query offset (optional) - Pagination offset (default: 0)
 * @returns Array of user's payments
 */
export const getUserPayments = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id as number;
    const { limit = '20', offset = '0' } = req.query;

    const results = await paymentService.getUserPayments(userId);

    const offsetNum = parseInt(String(offset)) || 0;
    const limitNum = Math.min(parseInt(String(limit)) || 20, 100);

    const paginatedResults = results.slice(offsetNum, offsetNum + limitNum);

    sendSuccess(
      res,
      {
        payments: paginatedResults,
        total: results.length,
        limit: limitNum,
        offset: offsetNum,
      },
      paginatedResults.length > 0
        ? 'Ödeme geçmişi alındı.'
        : 'Sizin henüz ödeme kaydınız yok.',
      200
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get reservation payments
 * @route GET /api/reservations/:reservationId/payments
 * @param reservationId Reservation ID
 * @returns Array of payments for reservation
 */
export const getReservationPayments = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { reservationId } = req.params as { reservationId: string };

    const result = await paymentService.getReservationPayments(
      parseInt(String(reservationId))
    );

    sendSuccess(
      res,
      result,
      result.length > 0
        ? 'Rezervasyonun ödeme kayıtları alındı.'
        : 'Bu rezervasyonun ödeme kaydı bulunmuyor.',
      200
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get payment statistics (Admin only)
 * @route GET /api/payments/stats
 * @middleware authMiddleware, requireAdmin
 * @query startDate - Start date (ISO 8601)
 * @query endDate - End date (ISO 8601)
 * @returns Payment statistics for period
 */
export const getPaymentStats = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { startDate, endDate } = req.query as { startDate: string; endDate: string };

    const result = await paymentService.getPaymentStatistics(
      new Date(startDate),
      new Date(endDate)
    );

    sendSuccess(
      res,
      result,
      'Ödeme istatistikleri alındı.',
      200
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get user's total spending
 * @route GET /api/payments/user/spending
 * @middleware authMiddleware
 * @returns Total amount spent by user
 */
export const getUserTotalSpending = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id as number;

    const totalSpending = await paymentService.getUserTotalSpending(userId);

    sendSuccess(
      res,
      { totalSpending },
      'Toplam harcama miktarı alındı.',
      200
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Process refund (Admin only)
 * @route POST /api/payments/:paymentId/refund
 * @middleware authMiddleware, requireAdmin
 * @param paymentId Payment ID
 * @returns Refunded payment details
 */
export const processRefund = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { paymentId } = req.params as { paymentId: string };

    const result = await paymentService.processRefund(parseInt(String(paymentId)));

    sendSuccess(
      res,
      result,
      'Geri ödeme başarıyla işlendi.',
      200
    );
  } catch (error) {
    next(error);
  }
};
