/**
 * ParkingLot Repository — Data access layer for ParkingLot entity
 * Handles all database operations for parking lots
 * Per backend-rules.md: Veri tabanı bağlantıları her zaman asenkron (async/await) olmalı
 */

import prisma from '../Models';
import { BaseRepository } from './BaseRepository';
import { Logger } from '../Utils/logger';

export interface ParkingLotCreateData {
  name: string;
  latitude: number;
  longitude: number;
  capacity: number;
  hourlyRate: number;
  providerId: number;
  address: string;
  workingHours: string;
}

export interface ParkingLotUpdateData {
  name?: string;
  latitude?: number;
  longitude?: number;
  capacity?: number;
  hourlyRate?: number;
  address?: string;
  workingHours?: string;
  currentOccupancy?: number;
}

export interface ParkingLot {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  address: string;
  workingHours: string;
  capacity: number;
  currentOccupancy: number;
  hourlyRate: number;
  providerId: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface NearbyParkingLot extends ParkingLot {
  distance: number; // kilometers
}

export class ParkingLotRepository extends BaseRepository<ParkingLot, ParkingLotCreateData, ParkingLotUpdateData> {
  /**
   * Create a new parking lot
   */
  async create(data: ParkingLotCreateData): Promise<ParkingLot> {
    return prisma.parkingLot.create({
      data,
    });
  }

  /**
   * Find parking lot by ID
   */
  async findById(id: number): Promise<ParkingLot | null> {
    return prisma.parkingLot.findUnique({
      where: { id },
    });
  }

  /**
   * Find all parking lots with optional filtering
   */
  async findAll(filters?: any): Promise<ParkingLot[]> {
    return prisma.parkingLot.findMany({
      where: filters || {},
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Find parking lots by provider ID
   */
  async findByProviderId(providerId: number): Promise<ParkingLot[]> {
    return prisma.parkingLot.findMany({
      where: { providerId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Update parking lot
   */
  async update(id: number, data: ParkingLotUpdateData): Promise<ParkingLot> {
    return prisma.parkingLot.update({
      where: { id },
      data,
    });
  }

  /**
   * Delete parking lot
   */
  async delete(id: number): Promise<boolean> {
    try {
      await prisma.parkingLot.delete({
        where: { id },
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Find nearby parking lots using Haversine formula
   * Returns parking lots within specified radius
   * 
   * @param latitude User's current latitude
   * @param longitude User's current longitude
   * @param radiusKm Search radius in kilometers (default: 5km)
   * @returns Array of nearby parking lots with calculated distance
   */
  async findNearby(
    latitude: number,
    longitude: number,
    radiusKm: number = 5
  ): Promise<NearbyParkingLot[]> {
    try {
      Logger.debug('Fetching nearby parking lots', {
        lat: latitude,
        lng: longitude,
        radius: radiusKm,
      });

      // Get all parking lots
      const allParkingLots = await prisma.parkingLot.findMany();

      // Filter by Haversine distance
      const nearbyLots = allParkingLots
        .map((lot: ParkingLot): NearbyParkingLot => ({
          ...lot,
          distance: this.calculateDistance(
            latitude,
            longitude,
            lot.latitude,
            lot.longitude
          ),
        }))
        .filter((lot: NearbyParkingLot): boolean => lot.distance <= radiusKm)
        .sort((a: NearbyParkingLot, b: NearbyParkingLot): number => a.distance - b.distance);

      Logger.debug('Nearby parking lots found', {
        count: nearbyLots.length,
        radius: radiusKm,
      });

      return nearbyLots;
    } catch (error) {
      Logger.error('Error finding nearby parking lots', error as Error);
      throw error;
    }
  }

  /**
   * Calculate distance between two coordinates using Haversine formula
   * Returns distance in kilometers
   * 
   * @param lat1 First latitude
   * @param lon1 First longitude
   * @param lat2 Second latitude
   * @param lon2 Second longitude
   * @returns Distance in kilometers
   */
  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return Math.round(distance * 100) / 100; // Round to 2 decimal places
  }

  /**
   * Convert degrees to radians
   */
  private toRad(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Get available capacity for a parking lot
   * (total capacity - currently parked vehicles)
   */
  async getAvailableCapacity(parkingLotId: number): Promise<number> {
    const lot = await prisma.parkingLot.findUnique({
      where: { id: parkingLotId },
    });

    if (!lot) {
      return 0;
    }

    // Count active parking sessions
    const activeSessions = await prisma.parkingSession.count({
      where: {
        parkingLotId,
        exitTime: null, // Currently parked (no exit time yet)
      },
    });

    return Math.max(0, lot.capacity - activeSessions);
  }
}
