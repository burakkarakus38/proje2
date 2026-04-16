/**
 * Parking Session Service
 * Per backend-rules.md: Business logic resides ONLY in Services layer
 * Handles entry/exit tracking and payment initiation
 */

import { ParkingSessionRepository } from '../Repositories/ParkingSessionRepository';
import { ReservationRepository } from '../Repositories/ReservationRepository';
import { ParkingLotRepository } from '../Repositories/ParkingLotRepository';
import { PaymentRepository } from '../Repositories/PaymentRepository';
import { PaymentService } from './paymentService';
import { AppError } from '../Utils/AppError';
import { Logger } from '../Utils/logger';
import { PaymentMethod, PaymentStatus, ReservationStatus } from '@prisma/client';

const OVERSTAY_PENALTY_MULTIPLIER = 1.5;

export interface EntrySessionDTO {
  reservationId: number;
  vehicleId: number;
  parkingLotId: number;
  userId: number;
}

export interface ExitSessionDTO {
  parkingSessionId: number;
  paymentMethod: PaymentMethod;
}

export interface ParkingSessionResponse {
  id: number;
  reservationId: number;
  vehicleId: number;
  parkingLotId: number;
  userId: number;
  entryTime: Date;
  exitTime: Date | null;
  durationMinutes: number | null;
  durationHours: number | null;
  chargedAmount: number | null;
  reservationFee: number | null;
  overstayFee: number | null;
  overstayMinutes: number | null;
}

export interface PaymentInitiatedResponse {
  paymentId: number;
  reservationId: number;
  amount: number;
  paymentMethod: string;
  status: string;
}

export class ParkingSessionService {
  private parkingSessionRepository: ParkingSessionRepository;
  private reservationRepository: ReservationRepository;
  private parkingLotRepository: ParkingLotRepository;
  private paymentRepository: PaymentRepository;
  private paymentService: PaymentService;

  constructor() {
    this.parkingSessionRepository = new ParkingSessionRepository();
    this.reservationRepository = new ReservationRepository();
    this.parkingLotRepository = new ParkingLotRepository();
    this.paymentRepository = new PaymentRepository();
    this.paymentService = new PaymentService();
  }

  /**
   * Record vehicle entry into parking lot
   * 
   * Steps:
   * 1. Verify reservation exists and is valid
   * 2. Check if vehicle already has active session
   * 3. Create parking session with entry time
   * 4. Update reservation status to ACTIVE
   * 5. Return session details
   * 
   * @param data Entry session data
   * @returns Created parking session
   */
  async recordEntry(data: EntrySessionDTO): Promise<ParkingSessionResponse> {
    try {
      Logger.debug('Recording vehicle entry', {
        reservationId: data.reservationId,
        vehicleId: data.vehicleId,
        parkingLotId: data.parkingLotId,
      });

      // 1. Verify reservation exists
      const reservation = await this.reservationRepository.findById(
        data.reservationId
      );

      if (!reservation) {
        throw new AppError('Rezervasyon bulunamadı.', 404);
      }

      if (reservation.status === ReservationStatus.CANCELLED) {
        throw new AppError(
          'İptal edilen rezervasyon ile giriş yapılamaz.',
          400
        );
      }

      if (reservation.status === ReservationStatus.COMPLETED) {
        throw new AppError(
          'Tamamlanan rezervasyon ile giriş yapılamaz.',
          400
        );
      }

      // 2. Check if vehicle already has active session
      const existingSession = await this.parkingSessionRepository.findActiveForVehicle(
        data.vehicleId
      );

      if (existingSession) {
        throw new AppError(
          'Bu araç zaten otoparkta kayıtlı. Lütfen önce çıkış yapın.',
          409
        );
      }

      // 3. Create parking session
      const parkingSession = await this.parkingSessionRepository.create({
        reservationId: data.reservationId,
        vehicleId: data.vehicleId,
        parkingLotId: data.parkingLotId,
        userId: data.userId,
        entryTime: new Date(),
      });

      // 4. Update reservation status to ACTIVE
      await this.reservationRepository.update(data.reservationId, {
        status: ReservationStatus.ACTIVE,
      });

      Logger.info('Vehicle entry recorded', {
        parkingSessionId: parkingSession.id,
        vehicleId: data.vehicleId,
      });

      // 5. Return session response
      return {
        id: parkingSession.id,
        reservationId: parkingSession.reservationId,
        vehicleId: parkingSession.vehicleId,
        parkingLotId: parkingSession.parkingLotId,
        userId: parkingSession.userId,
        entryTime: parkingSession.entryTime,
        exitTime: parkingSession.exitTime,
        durationMinutes: null,
        durationHours: null,
        chargedAmount: null,
        reservationFee: null,
        overstayFee: null,
        overstayMinutes: null,
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      Logger.error('Error recording vehicle entry', error as Error);
      throw new AppError('Giriş kaydında hata oluştu.', 500);
    }
  }

  /**
   * Record vehicle exit, calculate overstay penalty if applicable, and
   * complete payment in a single operation.
   *
   * Billing rules:
   *   - Normal stay  (exitTime <= reservation.endTime):
   *       fee = ceil(actualDurationHours) * hourlyRate
   *   - Overstay     (exitTime >  reservation.endTime):
   *       reservationFee = ceil(reservedDurationHours) * hourlyRate
   *       overstayFee    = ceil(overstayDurationHours) * hourlyRate * OVERSTAY_PENALTY_MULTIPLIER (1.5×)
   *       totalFee       = reservationFee + overstayFee
   *
   * Steps:
   *   1. Verify session exists and has no exitTime.
   *   2. Stamp exitTime = now.
   *   3. Fetch reservation for scheduled endTime; fetch parking lot for hourlyRate.
   *   4. Compute billing (with optional overstay penalty).
   *   5. Create Payment record (PENDING), then process it to COMPLETED via PaymentService.
   *   6. Mark reservation as COMPLETED.
   *   7. Return enriched session + payment response.
   *
   * @param data Exit session data (parkingSessionId + paymentMethod)
   * @returns Session with billing breakdown and completed payment details
   */
  async recordExit(
    data: ExitSessionDTO
  ): Promise<{
    session: ParkingSessionResponse;
    payment: PaymentInitiatedResponse;
  }> {
    try {
      Logger.debug('Recording vehicle exit', {
        parkingSessionId: data.parkingSessionId,
        paymentMethod: data.paymentMethod,
      });

      // Step 1 — verify session is open
      let parkingSession = await this.parkingSessionRepository.findById(
        data.parkingSessionId
      );

      if (!parkingSession) {
        throw new AppError('Park session bulunamadı.', 404);
      }

      if (parkingSession.exitTime !== null) {
        throw new AppError('Bu araç zaten çıkış yapmış, session kapalı.', 400);
      }

      // Step 2 — stamp exit time
      const exitTime = new Date();
      parkingSession = await this.parkingSessionRepository.update(
        data.parkingSessionId,
        { exitTime }
      );

      // Step 3 — fetch reservation and parking lot in parallel
      const [reservation, parkingLot] = await Promise.all([
        this.reservationRepository.findById(parkingSession.reservationId),
        this.parkingLotRepository.findById(parkingSession.parkingLotId),
      ]);

      if (!reservation) {
        throw new AppError('İlgili rezervasyon bulunamadı.', 404);
      }

      if (!parkingLot) {
        throw new AppError('Otopark bilgisi bulunamadı.', 404);
      }

      // Step 4 — compute billing
      const billing = this.computeBilling(
        parkingSession.entryTime,
        exitTime,
        reservation.endTime,
        parkingLot.hourlyRate
      );

      // Step 5 — create payment (PENDING) then process it to COMPLETED
      const pendingPayment = await this.paymentRepository.create({
        reservationId: parkingSession.reservationId,
        userId: parkingSession.userId,
        amount: billing.totalFee,
        paymentMethod: data.paymentMethod,
        status: PaymentStatus.PENDING,
      });

      const completedPayment = await this.paymentService.processPayment(
        pendingPayment.id
      );

      // Step 6 — mark reservation as COMPLETED
      await this.reservationRepository.update(parkingSession.reservationId, {
        status: ReservationStatus.COMPLETED,
      });

      Logger.info('Vehicle exit recorded, payment completed', {
        parkingSessionId: data.parkingSessionId,
        totalFee: billing.totalFee,
        reservationFee: billing.reservationFee,
        overstayFee: billing.overstayFee,
        overstayMinutes: billing.overstayMinutes,
        paymentId: completedPayment.id,
      });

      // Step 7 — build response
      const sessionResponse: ParkingSessionResponse = {
        id: parkingSession.id,
        reservationId: parkingSession.reservationId,
        vehicleId: parkingSession.vehicleId,
        parkingLotId: parkingSession.parkingLotId,
        userId: parkingSession.userId,
        entryTime: parkingSession.entryTime,
        exitTime: parkingSession.exitTime,
        durationMinutes: this.parkingSessionRepository.calculateDuration(parkingSession),
        durationHours: this.parkingSessionRepository.calculateDurationHours(parkingSession),
        chargedAmount: billing.totalFee,
        reservationFee: billing.reservationFee,
        overstayFee: billing.overstayFee,
        overstayMinutes: billing.overstayMinutes,
      };

      const paymentResponse: PaymentInitiatedResponse = {
        paymentId: completedPayment.id,
        reservationId: completedPayment.reservationId,
        amount: completedPayment.amount,
        paymentMethod: completedPayment.paymentMethod,
        status: completedPayment.status,
      };

      return { session: sessionResponse, payment: paymentResponse };
    } catch (error) {
      if (error instanceof AppError) throw error;
      Logger.error('Error recording vehicle exit', error as Error);
      throw new AppError('Çıkış kaydında hata oluştu.', 500);
    }
  }

  /**
   * Get active parking session for a vehicle
   */
  async getActiveSession(vehicleId: number): Promise<ParkingSessionResponse | null> {
    try {
      const session = await this.parkingSessionRepository.findActiveForVehicle(
        vehicleId
      );

      if (!session) {
        return null;
      }

      return {
        id: session.id,
        reservationId: session.reservationId,
        vehicleId: session.vehicleId,
        parkingLotId: session.parkingLotId,
        userId: session.userId,
        entryTime: session.entryTime,
        exitTime: session.exitTime,
        durationMinutes: null,
        durationHours: null,
        chargedAmount: null,
        reservationFee: null,
        overstayFee: null,
        overstayMinutes: null,
      };
    } catch (error) {
      Logger.error('Error fetching active session', error as Error);
      throw error;
    }
  }

  /**
   * Get session details
   */
  async getSessionDetails(
    parkingSessionId: number
  ): Promise<ParkingSessionResponse | null> {
    try {
      const session = await this.parkingSessionRepository.findById(
        parkingSessionId
      );

      if (!session) {
        return null;
      }

      let durationMinutes = null;
      let durationHours = null;

      if (session.exitTime) {
        durationMinutes = this.parkingSessionRepository.calculateDuration(session);
        durationHours = this.parkingSessionRepository.calculateDurationHours(session);
      }

      return {
        id: session.id,
        reservationId: session.reservationId,
        vehicleId: session.vehicleId,
        parkingLotId: session.parkingLotId,
        userId: session.userId,
        entryTime: session.entryTime,
        exitTime: session.exitTime,
        durationMinutes,
        durationHours,
        chargedAmount: null,
        reservationFee: null,
        overstayFee: null,
        overstayMinutes: null,
      };
    } catch (error) {
      Logger.error('Error fetching session details', error as Error);
      throw error;
    }
  }

  /**
   * Compute the final billing breakdown for a parking session.
   *
   * If the vehicle exits on time (or early), the full actual duration is
   * billed at the normal hourlyRate (ceiling-rounded to whole hours).
   *
   * If the vehicle overstays past reservation.endTime, the billing is split:
   *   - Reserved portion  → ceil(reservedHours)  * hourlyRate
   *   - Overstay portion  → ceil(overstayHours)  * hourlyRate * OVERSTAY_PENALTY_MULTIPLIER
   *
   * All monetary values are rounded to 2 decimal places.
   *
   * @param entryTime      Actual vehicle entry timestamp
   * @param exitTime       Actual vehicle exit timestamp (now)
   * @param scheduledEnd   Reservation's originally scheduled end time
   * @param hourlyRate     Parking lot's normal hourly rate
   */
  private computeBilling(
    entryTime: Date,
    exitTime: Date,
    scheduledEnd: Date,
    hourlyRate: number
  ): {
    reservationFee: number;
    overstayFee: number;
    overstayMinutes: number;
    totalFee: number;
  } {
    const round2 = (n: number) => Math.round(n * 100) / 100;

    if (exitTime <= scheduledEnd) {
      // Normal exit — bill the actual stay at the standard rate
      const actualMs = exitTime.getTime() - entryTime.getTime();
      const actualHours = Math.ceil(actualMs / (1000 * 60 * 60));
      const reservationFee = round2(actualHours * hourlyRate);

      return { reservationFee, overstayFee: 0, overstayMinutes: 0, totalFee: reservationFee };
    }

    // Overstay — bill reserved window at normal rate, extra window at penalty rate
    const reservedMs = scheduledEnd.getTime() - entryTime.getTime();
    const reservedHours = Math.ceil(reservedMs / (1000 * 60 * 60));
    const reservationFee = round2(reservedHours * hourlyRate);

    const overstayMs = exitTime.getTime() - scheduledEnd.getTime();
    const overstayMinutes = Math.ceil(overstayMs / (1000 * 60));
    const overstayHours = Math.ceil(overstayMs / (1000 * 60 * 60));
    const penaltyRate = hourlyRate * OVERSTAY_PENALTY_MULTIPLIER;
    const overstayFee = round2(overstayHours * penaltyRate);

    return {
      reservationFee,
      overstayFee,
      overstayMinutes,
      totalFee: round2(reservationFee + overstayFee),
    };
  }

  /**
   * Get user's parking sessions
   */
  async getUserSessions(userId: number): Promise<ParkingSessionResponse[]> {
    try {
      const sessions = await this.parkingSessionRepository.findByUserId(userId);

      return sessions.map((session) => ({
        id: session.id,
        reservationId: session.reservationId,
        vehicleId: session.vehicleId,
        parkingLotId: session.parkingLotId,
        userId: session.userId,
        entryTime: session.entryTime,
        exitTime: session.exitTime,
        durationMinutes: session.exitTime
          ? this.parkingSessionRepository.calculateDuration(session)
          : null,
        durationHours: session.exitTime
          ? this.parkingSessionRepository.calculateDurationHours(session)
          : null,
        chargedAmount: null,
        reservationFee: null,
        overstayFee: null,
        overstayMinutes: null,
      }));
    } catch (error) {
      Logger.error('Error fetching user sessions', error as Error);
      throw error;
    }
  }

  /**
   * Get parking lot statistics for daily reporting
   */
  async getParkingLotStats(parkingLotId: number, date: Date) {
    try {
      const stats = await this.parkingSessionRepository.getDailyStats(
        parkingLotId,
        date
      );

      Logger.info('Parking lot stats calculated', {
        parkingLotId,
        date: date.toISOString(),
        stats,
      });

      return stats;
    } catch (error) {
      Logger.error('Error calculating parking lot stats', error as Error);
      throw error;
    }
  }
}
