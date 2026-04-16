/**
 * ParkingSession Repository — Data access layer for ParkingSession entity
 * Handles database operations for parking sessions (entry/exit records)
 * Per backend-rules.md: Veri tabanı bağlantıları her zaman asenkron (async/await) olmalı
 */

import prisma from '../Models';
import { BaseRepository } from './BaseRepository';
import { Logger } from '../Utils/logger';
import { ParkingLot } from './ParkingLotRepository';

export interface ParkingSessionCreateData {
  reservationId: number;
  vehicleId: number;
  parkingLotId: number;
  userId: number;
  entryTime?: Date;
  exitTime?: Date;
}

export interface ParkingSessionUpdateData {
  exitTime?: Date;
}

export interface ParkingSession {
  id: number;
  reservationId: number;
  vehicleId: number;
  parkingLotId: number;
  userId: number;
  entryTime: Date;
  exitTime: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

/** Used internally by getDailyStats which includes the parkingLot relation */
export interface ParkingSessionWithLot extends ParkingSession {
  parkingLot: ParkingLot;
}

export class ParkingSessionRepository extends BaseRepository<ParkingSession, ParkingSessionCreateData, ParkingSessionUpdateData> {
  /**
   * Create a new parking session
   */
  async create(data: ParkingSessionCreateData): Promise<ParkingSession> {
    return prisma.parkingSession.create({
      data,
    });
  }

  /**
   * Find parking session by ID
   */
  async findById(id: number): Promise<ParkingSession | null> {
    return prisma.parkingSession.findUnique({
      where: { id },
    });
  }

  /**
   * Find parking session by reservation ID
   */
  async findByReservationId(reservationId: number): Promise<ParkingSession | null> {
    return prisma.parkingSession.findUnique({
      where: { reservationId },
    });
  }

  /**
   * Find all parking sessions with optional filtering
   */
  async findAll(filters?: any): Promise<ParkingSession[]> {
    return prisma.parkingSession.findMany({
      where: filters || {},
      orderBy: { entryTime: 'desc' },
    });
  }

  /**
   * Find active parking sessions (with no exit time)
   */
  async findActive(): Promise<ParkingSession[]> {
    return prisma.parkingSession.findMany({
      where: { exitTime: null },
      orderBy: { entryTime: 'asc' },
    });
  }

  /**
   * Find active parking sessions for a specific vehicle
   */
  async findActiveForVehicle(vehicleId: number): Promise<ParkingSession | null> {
    return prisma.parkingSession.findFirst({
      where: {
        vehicleId,
        exitTime: null,
      },
      orderBy: { entryTime: 'desc' },
    });
  }

  /**
   * Find parking sessions by user ID
   */
  async findByUserId(userId: number): Promise<ParkingSession[]> {
    return prisma.parkingSession.findMany({
      where: { userId },
      orderBy: { entryTime: 'desc' },
    });
  }

  /**
   * Find parking sessions by parking lot ID
   */
  async findByParkingLotId(parkingLotId: number): Promise<ParkingSession[]> {
    return prisma.parkingSession.findMany({
      where: { parkingLotId },
      orderBy: { entryTime: 'desc' },
    });
  }

  /**
   * Update parking session
   */
  async update(id: number, data: ParkingSessionUpdateData): Promise<ParkingSession> {
    return prisma.parkingSession.update({
      where: { id },
      data,
    });
  }

  /**
   * Delete parking session
   */
  async delete(id: number): Promise<boolean> {
    try {
      await prisma.parkingSession.delete({
        where: { id },
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Calculate parking duration in minutes
   * @param session Parking session with exitTime set
   * @returns Duration in minutes
   */
  calculateDuration(session: ParkingSession): number {
    if (!session.exitTime) {
      return 0;
    }
    const durationMs = session.exitTime.getTime() - session.entryTime.getTime();
    return Math.ceil(durationMs / (1000 * 60)); // Convert to minutes and round up
  }

  /**
   * Calculate parking duration in hours (for billing)
   * Rounds up to nearest hour for charging purposes
   * @param session Parking session with exitTime set
   * @returns Duration in hours (rounded up)
   */
  calculateDurationHours(session: ParkingSession): number {
    if (!session.exitTime) {
      return 0;
    }
    const durationMs = session.exitTime.getTime() - session.entryTime.getTime();
    const hours = durationMs / (1000 * 60 * 60);
    return Math.ceil(hours); // Always round up for billing
  }

  /**
   * Get all incomplete sessions (active parking)
   * @returns Array of sessions still parked
   */
  async getIncompleteSessions(): Promise<ParkingSession[]> {
    return prisma.parkingSession.findMany({
      where: {
        exitTime: null,
      },
      include: {
        vehicle: true,
        parkingLot: true,
        user: true,
      },
      orderBy: { entryTime: 'asc' },
    });
  }

  /**
   * Get daily parking statistics
   * @param parkingLotId Parking lot ID
   * @returns Daily statistics
   */
  async getDailyStats(parkingLotId: number, date: Date): Promise<{
    totalSessions: number;
    completedSessions: number;
    avgDuration: number;
    totalRevenue: number;
  }> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const sessions = await prisma.parkingSession.findMany({
      where: {
        parkingLotId,
        entryTime: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      include: {
        parkingLot: true,
      },
    }) as ParkingSessionWithLot[];

    const completedSessions = sessions.filter((s: ParkingSessionWithLot): boolean => s.exitTime !== null);
    const avgDuration =
      completedSessions.length > 0
        ? completedSessions.reduce(
            (acc: number, s: ParkingSessionWithLot): number => acc + this.calculateDurationHours(s),
            0
          ) / completedSessions.length
        : 0;

    let totalRevenue = 0;
    completedSessions.forEach((session: ParkingSessionWithLot): void => {
      const hours = this.calculateDurationHours(session);
      totalRevenue += hours * session.parkingLot.hourlyRate;
    });

    return {
      totalSessions: sessions.length,
      completedSessions: completedSessions.length,
      avgDuration: Math.round(avgDuration * 100) / 100,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
    };
  }
}
