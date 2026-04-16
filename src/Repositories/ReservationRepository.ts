/**
 * Reservation Repository — Data access layer for Reservation entity
 * Handles all database operations and queries for reservations
 * Per backend-rules.md: Veri tabanı bağlantıları her zaman asenkron (async/await) olmalı
 */

import prisma from '../Models';
import { BaseRepository } from './BaseRepository';
import { Logger } from '../Utils/logger';
import { ReservationStatus } from '@prisma/client';

export interface ReservationCreateData {
  vehicleId: number;
  parkingLotId: number;
  userId: number;
  startTime: Date;
  endTime: Date;
  totalPrice: number;
  status?: ReservationStatus;
}

export interface ReservationUpdateData {
  startTime?: Date;
  endTime?: Date;
  totalPrice?: number;
  status?: ReservationStatus;
}

export interface Reservation {
  id: number;
  vehicleId: number;
  parkingLotId: number;
  userId: number;
  startTime: Date;
  endTime: Date;
  totalPrice: number;
  status: ReservationStatus;
  createdAt: Date;
  updatedAt: Date;
}

export class ReservationRepository extends BaseRepository<Reservation, ReservationCreateData, ReservationUpdateData> {
  /**
   * Create a new reservation
   */
  async create(data: ReservationCreateData): Promise<Reservation> {
    return prisma.reservation.create({
      data,
    });
  }

  /**
   * Find reservation by ID
   */
  async findById(id: number): Promise<Reservation | null> {
    return prisma.reservation.findUnique({
      where: { id },
    });
  }

  /**
   * Find all reservations with optional filtering
   */
  async findAll(filters?: any): Promise<Reservation[]> {
    return prisma.reservation.findMany({
      where: filters || {},
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Find reservations by user ID
   */
  async findByUserId(userId: number): Promise<Reservation[]> {
    return prisma.reservation.findMany({
      where: { userId },
      orderBy: { startTime: 'desc' },
    });
  }

  /**
   * Find reservations by parking lot ID
   */
  async findByParkingLotId(parkingLotId: number): Promise<Reservation[]> {
    return prisma.reservation.findMany({
      where: { parkingLotId },
      orderBy: { startTime: 'desc' },
    });
  }

  /**
   * Find reservations by vehicle ID
   */
  async findByVehicleId(vehicleId: number): Promise<Reservation[]> {
    return prisma.reservation.findMany({
      where: { vehicleId },
      orderBy: { startTime: 'desc' },
    });
  }

  /**
   * Update reservation
   */
  async update(id: number, data: ReservationUpdateData): Promise<Reservation> {
    return prisma.reservation.update({
      where: { id },
      data,
    });
  }

  /**
   * Delete reservation
   */
  async delete(id: number): Promise<boolean> {
    try {
      await prisma.reservation.delete({
        where: { id },
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Check for time overlap between reservations
   * Returns true if there's a conflicting reservation
   * 
   * @param parkingLotId Parking lot ID
   * @param startTime Desired start time
   * @param endTime Desired end time
   * @param excludeReservationId If updating, exclude this reservation ID from check
   * @returns true if overlap detected, false otherwise
   */
  async hasTimeOverlap(
    parkingLotId: number,
    startTime: Date,
    endTime: Date,
    excludeReservationId?: number
  ): Promise<boolean> {
    try {
      Logger.debug('Checking reservation overlap', {
        parkingLotId,
        startTime,
        endTime,
      });

      const overlappingReservations = await prisma.reservation.findMany({
        where: {
          parkingLotId,
          // Status should NOT be CANCELLED for overlap check
          status: {
            not: ReservationStatus.CANCELLED,
          },
          // Check if there's any overlap with requested time window
          AND: [
            {
              startTime: {
                lt: endTime, // Existing reservation starts before request ends
              },
            },
            {
              endTime: {
                gt: startTime, // Existing reservation ends after request starts
              },
            },
          ],
          // Exclude current reservation if updating
          ...(excludeReservationId && {
            id: {
              not: excludeReservationId,
            },
          }),
        },
      });

      const hasOverlap = overlappingReservations.length > 0;

      Logger.debug('Overlap check result', {
        hasOverlap,
        conflictCount: overlappingReservations.length,
      });

      return hasOverlap;
    } catch (error) {
      Logger.error('Error checking reservation overlap', error as Error);
      throw error;
    }
  }

  /**
   * Get active reservations for a parking lot (ACTIVE and PENDING status)
   * Useful for capacity checking
   */
  async getActiveReservations(parkingLotId: number): Promise<Reservation[]> {
    return prisma.reservation.findMany({
      where: {
        parkingLotId,
        status: {
          in: [ReservationStatus.ACTIVE, ReservationStatus.PENDING],
        },
      },
      orderBy: { startTime: 'asc' },
    });
  }

  /**
   * Get reservation statistics for a parking lot
   * Returns count of reservations by status
   */
  async getReservationStats(parkingLotId: number): Promise<{
    pending: number;
    active: number;
    completed: number;
    cancelled: number;
    total: number;
  }> {
    const reservations = await prisma.reservation.findMany({
      where: { parkingLotId },
    });

    return {
      pending: reservations.filter((r: Reservation): boolean => r.status === ReservationStatus.PENDING).length,
      active: reservations.filter((r: Reservation): boolean => r.status === ReservationStatus.ACTIVE).length,
      completed: reservations.filter((r: Reservation): boolean => r.status === ReservationStatus.COMPLETED).length,
      cancelled: reservations.filter((r: Reservation): boolean => r.status === ReservationStatus.CANCELLED).length,
      total: reservations.length,
    };
  }

  /**
   * Find upcoming reservations (starting within next 24 hours)
   */
  async getUpcomingReservations(
    parkingLotId: number,
    hoursAhead: number = 24
  ): Promise<Reservation[]> {
    const now = new Date();
    const futureTime = new Date(Date.now() + hoursAhead * 60 * 60 * 1000);

    return prisma.reservation.findMany({
      where: {
        parkingLotId,
        startTime: {
          gte: now,
          lte: futureTime,
        },
        status: {
          in: [ReservationStatus.PENDING, ReservationStatus.ACTIVE],
        },
      },
      orderBy: { startTime: 'asc' },
    });
  }
}
