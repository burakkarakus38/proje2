/**
 * Reservation Service
 * Per backend-rules.md: Business logic resides ONLY in Services layer
 * Handles reservation creation, validation, overlap checking, and pricing
 */

import { Prisma } from '@prisma/client';
import { ReservationRepository } from '../Repositories/ReservationRepository';
import { ParkingLotRepository } from '../Repositories/ParkingLotRepository';
import { ParkingSessionRepository } from '../Repositories/ParkingSessionRepository';
import { AppError } from '../Utils/AppError';
import { Logger } from '../Utils/logger';
import prisma from '../Models';

export interface CreateReservationDTO {
  vehicleId: number;
  parkingLotId: number;
  userId: number;
  startTime: Date;
  endTime?: Date;
  plannedDuration?: number; // in hours
}

export interface ReservationResponse {
  id: number;
  vehicleId: number;
  parkingLotId: number;
  userId: number;
  startTime: Date;
  endTime: Date;
  totalPrice: number;
  status: string;
  durationHours: number;
}

export class ReservationService {
  private reservationRepository: ReservationRepository;
  private parkingLotRepository: ParkingLotRepository;
  private parkingSessionRepository: ParkingSessionRepository;

  constructor() {
    this.reservationRepository = new ReservationRepository();
    this.parkingLotRepository = new ParkingLotRepository();
    this.parkingSessionRepository = new ParkingSessionRepository();
  }

  /**
   * Create a new reservation with concurrency-safe capacity enforcement.
   *
   * Uses a Prisma Interactive Transaction at Serializable isolation so that
   * the occupancy read and the INSERT are a single atomic unit.  If two
   * requests race on the last available slot PostgreSQL will abort one of
   * them with a serialization-failure (P2034), which we surface as 409.
   *
   * Steps inside the transaction:
   *   1. Read the parking lot (existence + hourlyRate).
   *   2. Count active/pending reservations that overlap the requested window
   *      — this is the "locked read" that prevents double-booking.
   *   3. Reject with 409 Conflict if currentOccupancy >= capacity.
   *   4. Create the reservation (occupancy implicitly increments by 1).
   *
   * @param data Reservation creation data
   * @returns Created reservation with calculated price and duration
   */
  async createReservation(
    data: CreateReservationDTO
  ): Promise<ReservationResponse> {
    // ── Pre-transaction validation (no DB I/O needed) ──────────────────────
    
    // Calculate endTime from plannedDuration if not provided
    let endTime = data.endTime;
    if (!endTime && data.plannedDuration) {
      endTime = new Date(data.startTime.getTime() + data.plannedDuration * 60 * 60 * 1000);
    }

    if (!endTime) {
      throw new AppError(
        'Bitiş zamanı veya planlanan süre gereklidir.',
        400
      );
    }

    if (endTime <= data.startTime) {
      throw new AppError(
        'Bitiş zamanı başlangıç zamanından sonra olmalıdır.',
        400
      );
    }

    if (data.startTime < new Date()) {
      throw new AppError('Başlangıç zamanı gelecekte olmalıdır.', 400);
    }

    Logger.debug('Creating reservation (transaction)', {
      vehicleId: data.vehicleId,
      parkingLotId: data.parkingLotId,
      userId: data.userId,
      startTime: data.startTime,
      endTime: endTime,
      plannedDuration: data.plannedDuration,
    });

    try {
      // ── Atomic block ───────────────────────────────────────────────────────
      const created = await prisma.$transaction(
        async (tx) => {
          // Step 1 — fetch parking lot inside the transaction
          const parkingLot = await tx.parkingLot.findUnique({
            where: { id: data.parkingLotId },
          });

          if (!parkingLot) {
            throw new AppError('Otopark bulunamadı.', 404);
          }

          // Step 2 — count reservations that overlap the requested window.
          // Statuses CANCELLED and COMPLETED do not occupy a slot.
          // All other rows (PENDING, ACTIVE) do.
          const currentOccupancy = await tx.reservation.count({
            where: {
              parkingLotId: data.parkingLotId,
              status: { notIn: ['CANCELLED', 'COMPLETED'] },
              AND: [
                { startTime: { lt: endTime } },
                { endTime: { gt: data.startTime } },
              ],
            },
          });

          // Step 3 — capacity guard
          if (currentOccupancy >= parkingLot.capacity) {
            throw new AppError(
              `Otopark bu zaman aralığı için dolu (${currentOccupancy}/${parkingLot.capacity} slot kullanımda). Lütfen farklı bir zaman aralığı seçin.`,
              409
            );
          }

          // Step 4 — create reservation (occupancy atomically becomes currentOccupancy + 1)
          const durationHours = this.calculateDurationHours(
            data.startTime,
            endTime
          );
          const totalPrice = this.calculatePrice(
            durationHours,
            parkingLot.hourlyRate
          );

          return tx.reservation.create({
            data: {
              vehicleId: data.vehicleId,
              parkingLotId: data.parkingLotId,
              userId: data.userId,
              startTime: data.startTime,
              endTime: endTime,
              totalPrice,
              status: 'PENDING',
            },
          });
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
      );
      // ── End atomic block ───────────────────────────────────────────────────

      const durationHours = this.calculateDurationHours(
        created.startTime,
        created.endTime
      );

      Logger.info('Reservation created successfully', {
        reservationId: created.id,
        totalPrice: created.totalPrice,
        durationHours,
      });

      return {
        id: created.id,
        vehicleId: created.vehicleId,
        parkingLotId: created.parkingLotId,
        userId: created.userId,
        startTime: created.startTime,
        endTime: created.endTime,
        totalPrice: created.totalPrice,
        status: created.status,
        durationHours,
      };
    } catch (error) {
      if (error instanceof AppError) throw error;

      // PostgreSQL aborts a Serializable transaction when it detects that
      // allowing it to commit would produce a non-serializable result (i.e.
      // two concurrent requests racing on the same slot).  Surface this as
      // a user-facing 409 Conflict per backend-rules.md.
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2034'
      ) {
        throw new AppError(
          'Rezervasyon çakışması tespit edildi. Lütfen birkaç saniye bekleyip tekrar deneyin.',
          409
        );
      }

      Logger.error('Error creating reservation', error as Error);
      throw new AppError('Rezervasyon oluşturulurken bir hata oluştu.', 500);
    }
  }

  /**
   * Get reservation details
   */
  async getReservation(reservationId: number): Promise<ReservationResponse | null> {
    try {
      const reservation = await this.reservationRepository.findById(reservationId);

      if (!reservation) {
        return null;
      }

      const durationHours = this.calculateDurationHours(
        reservation.startTime,
        reservation.endTime
      );

      return {
        id: reservation.id,
        vehicleId: reservation.vehicleId,
        parkingLotId: reservation.parkingLotId,
        userId: reservation.userId,
        startTime: reservation.startTime,
        endTime: reservation.endTime,
        totalPrice: reservation.totalPrice,
        status: reservation.status,
        durationHours,
      };
    } catch (error) {
      Logger.error('Error fetching reservation', error as Error);
      throw error;
    }
  }

  /**
   * Cancel a reservation
   */
  async cancelReservation(reservationId: number): Promise<void> {
    try {
      const reservation = await this.reservationRepository.findById(reservationId);

      if (!reservation) {
        throw new AppError('Rezervasyon bulunamadı.', 404);
      }

      if (reservation.status === 'CANCELLED') {
        throw new AppError('Bu rezervasyon zaten iptal edilmiş.', 400);
      }

      if (reservation.status === 'COMPLETED') {
        throw new AppError('Tamamlanan rezervasyonlar iptal edilemez.', 400);
      }

      await this.reservationRepository.update(reservationId, {
        status: 'CANCELLED',
      });

      Logger.info('Reservation cancelled', { reservationId });
    } catch (error) {
      if (error instanceof AppError) throw error;
      Logger.error('Error cancelling reservation', error as Error);
      throw new AppError('Rezervasyon iptal edilirken hata oluştu.', 500);
    }
  }

  /**
   * Get user's reservations
   */
  async getUserReservations(userId: number): Promise<ReservationResponse[]> {
    try {
      const reservations = await this.reservationRepository.findByUserId(userId);

      return reservations.map((res) => ({
        id: res.id,
        vehicleId: res.vehicleId,
        parkingLotId: res.parkingLotId,
        userId: res.userId,
        startTime: res.startTime,
        endTime: res.endTime,
        totalPrice: res.totalPrice,
        status: res.status,
        durationHours: this.calculateDurationHours(res.startTime, res.endTime),
      }));
    } catch (error) {
      Logger.error('Error fetching user reservations', error as Error);
      throw error;
    }
  }

  /**
   * Calculate duration in hours (rounded up for billing)
   * 
   * @param startTime Reservation start time
   * @param endTime Reservation end time
   * @returns Duration in hours (rounded up)
   */
  private calculateDurationHours(startTime: Date, endTime: Date): number {
    const durationMs = endTime.getTime() - startTime.getTime();
    const hours = durationMs / (1000 * 60 * 60);
    return Math.ceil(hours); // Always round up for billing
  }

  /**
   * Calculate total price based on duration and hourly rate
   * Formula: totalPrice = durationHours * hourlyRate
   * 
   * @param durationHours Parking duration in hours
   * @param hourlyRate Hourly rate from parking lot
   * @returns Total price (2 decimal places)
   */
  private calculatePrice(durationHours: number, hourlyRate: number): number {
    const price = durationHours * hourlyRate;
    return Math.round(price * 100) / 100; // Round to 2 decimal places
  }

  /**
   * Auto-complete reservations that have passed their endTime
   * Should be called periodically (e.g., by cron job)
   */
  async autoCompleteExpiredReservations(): Promise<number> {
    try {
      const now = new Date();

      // Find PENDING or ACTIVE reservations that have passed endTime
      const allReservations = await this.reservationRepository.findAll({
        status: {
          in: ['PENDING', 'ACTIVE'],
        },
      });

      const expiredReservations = allReservations.filter(
        (res) => res.endTime <= now
      );

      let completedCount = 0;

      for (const reservation of expiredReservations) {
        await this.reservationRepository.update(reservation.id, {
          status: 'COMPLETED',
        });
        completedCount++;
      }

      if (completedCount > 0) {
        Logger.info('Auto-completed expired reservations', {
          count: completedCount,
        });
      }

      return completedCount;
    } catch (error) {
      Logger.error('Error auto-completing reservations', error as Error);
      throw error;
    }
  }
}
