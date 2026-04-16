/**
 * Parking Lot Service
 * Per backend-rules.md: Business logic resides ONLY in Services layer
 * Handles parking lot queries and nearby location searches
 */

import { ParkingLotRepository } from '../Repositories/ParkingLotRepository';
import { AppError } from '../Utils/AppError';
import { Logger } from '../Utils/logger';

export type OccupancyStatus = 'GREEN' | 'YELLOW' | 'RED';

export interface ParkingLotDetailResponse {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  address: string;
  workingHours: string;
  capacity: number;
  currentOccupancy: number;
  hourlyRate: number;
  availableCapacity: number;
  occupancyStatus: OccupancyStatus;
  providerId: number;
}

export interface NearbyParkingLotResponse extends ParkingLotDetailResponse {
  distance: number; // in kilometers
}

export class ParkingLotService {
  private parkingLotRepository: ParkingLotRepository;

  /**
   * Get all parking lots in the system
   */
  async getAllParkingLots(): Promise<ParkingLotDetailResponse[]> {
    try {
      const lots = await this.parkingLotRepository.findAll();
      const enrichedLots: ParkingLotDetailResponse[] = [];

      for (const lot of lots) {
        const availableCapacity = await this.parkingLotRepository.getAvailableCapacity(lot.id);
        enrichedLots.push({
          id: lot.id,
          name: lot.name,
          latitude: lot.latitude,
          longitude: lot.longitude,
          address: lot.address,
          workingHours: lot.workingHours,
          currentOccupancy: lot.currentOccupancy,
          capacity: lot.capacity,
          hourlyRate: lot.hourlyRate,
          availableCapacity,
          occupancyStatus: this.computeOccupancyStatus(lot.capacity, availableCapacity),
          providerId: lot.providerId,
        });
      }
      return enrichedLots;
    } catch (error) {
      Logger.error('Error fetching all parking lots', error as Error);
      throw error;
    }
  }


  constructor() {
    this.parkingLotRepository = new ParkingLotRepository();
  }

  /**
   * Derive a colour-coded occupancy status for the frontend map.
   *
   * Thresholds (case spec §3.2):
   *   GREEN  — 0 % – 60 % occupied
   *   YELLOW — 61 % – 90 % occupied
   *   RED    — 91 % – 100 % occupied
   */
  private computeOccupancyStatus(
    capacity: number,
    availableCapacity: number
  ): OccupancyStatus {
    if (capacity === 0) return 'GREEN';
    const occupiedPct = ((capacity - availableCapacity) / capacity) * 100;
    if (occupiedPct <= 50) return 'GREEN';
    if (occupiedPct <= 80) return 'YELLOW';
    return 'RED';
  }

  /**
   * Find nearby parking lots based on user's coordinates
   * 
   * Steps:
   * 1. Validate input coordinates
   * 2. Call repository to find nearby lots using Haversine formula
   * 3. Get available capacity for each lot
   * 4. Sort by distance
   * 5. Return enriched results
   * 
   * @param latitude User's current latitude
   * @param longitude User's current longitude
   * @param radiusKm Search radius in kilometers (default: 5km, max: 50km)
   * @returns Array of nearby parking lots with distance
   */
  async findNearby(
    latitude: number,
    longitude: number,
    radiusKm: number = 5
  ): Promise<NearbyParkingLotResponse[]> {
    try {
      Logger.debug('Finding nearby parking lots', {
        latitude,
        longitude,
        radiusKm,
      });

      // 1. Validate coordinates
      if (
        latitude < -90 ||
        latitude > 90 ||
        longitude < -180 ||
        longitude > 180
      ) {
        throw new AppError(
          'Geçersiz koordinatlar. Latitude [-90, 90], Longitude [-180, 180] aralığında olmalıdır.',
          400
        );
      }

      // Validate radius (reasonable limit to prevent excessive queries)
      const validatedRadius = Math.min(Math.max(radiusKm, 1), 50);

      // 2. Find nearby lots using repository
      const nearbyLots = await this.parkingLotRepository.findNearby(
        latitude,
        longitude,
        validatedRadius
      );

      // 3. Enrich results with available capacity
      const enrichedLots: NearbyParkingLotResponse[] = [];

      for (const lot of nearbyLots) {
        const availableCapacity =
          await this.parkingLotRepository.getAvailableCapacity(lot.id);

        enrichedLots.push({
          id: lot.id,
          name: lot.name,
          latitude: lot.latitude,
          longitude: lot.longitude,
          address: lot.address,
          workingHours: lot.workingHours,
          currentOccupancy: lot.currentOccupancy,
          capacity: lot.capacity,
          hourlyRate: lot.hourlyRate,
          availableCapacity,
          occupancyStatus: this.computeOccupancyStatus(lot.capacity, availableCapacity),
          providerId: lot.providerId,
          distance: lot.distance,
        });
      }

      Logger.info('Nearby parking lots found', {
        count: enrichedLots.length,
        radius: validatedRadius,
      });

      return enrichedLots;
    } catch (error) {
      if (error instanceof AppError) throw error;
      Logger.error('Error finding nearby parking lots', error as Error);
      throw new AppError(
        'Yakın otoparkları ararken hata oluştu.',
        500
      );
    }
  }

  /**
   * Get detailed information about a specific parking lot
   */
  async getParkingLotDetails(parkingLotId: number): Promise<ParkingLotDetailResponse | null> {
    try {
      const lot = await this.parkingLotRepository.findById(parkingLotId);

      if (!lot) {
        return null;
      }

      const availableCapacity =
        await this.parkingLotRepository.getAvailableCapacity(parkingLotId);

      return {
        id: lot.id,
        name: lot.name,
        latitude: lot.latitude,
        longitude: lot.longitude,
        address: lot.address,
        workingHours: lot.workingHours,
        currentOccupancy: lot.currentOccupancy,
        capacity: lot.capacity,
        hourlyRate: lot.hourlyRate,
        availableCapacity,
        occupancyStatus: this.computeOccupancyStatus(lot.capacity, availableCapacity),
        providerId: lot.providerId,
      };
    } catch (error) {
      Logger.error('Error fetching parking lot details', error as Error);
      throw error;
    }
  }

  /**
   * Get all parking lots by provider
   */
  async getParkingLotsByProvider(providerId: number): Promise<ParkingLotDetailResponse[]> {
    try {
      const lots = await this.parkingLotRepository.findByProviderId(providerId);

      const enrichedLots: ParkingLotDetailResponse[] = [];

      for (const lot of lots) {
        const availableCapacity =
          await this.parkingLotRepository.getAvailableCapacity(lot.id);

        enrichedLots.push({
          id: lot.id,
          name: lot.name,
          latitude: lot.latitude,
          longitude: lot.longitude,
          address: lot.address,
          workingHours: lot.workingHours,
          currentOccupancy: lot.currentOccupancy,
          capacity: lot.capacity,
          hourlyRate: lot.hourlyRate,
          availableCapacity,
          occupancyStatus: this.computeOccupancyStatus(lot.capacity, availableCapacity),
          providerId: lot.providerId,
        });
      }

      return enrichedLots;
    } catch (error) {
      Logger.error('Error fetching provider parking lots', error as Error);
      throw error;
    }
  }

  /**
   * Create a new parking lot (provider operations)
   */
  async createParkingLot(
    name: string,
    latitude: number,
    longitude: number,
    address: string,
    workingHours: string,
    capacity: number,
    hourlyRate: number,
    providerId: number
  ): Promise<ParkingLotDetailResponse> {
    try {
      // Validate inputs
      if (capacity < 1) {
        throw new AppError('Kapasite en az 1 olmalıdır.', 400);
      }

      if (hourlyRate < 0) {
        throw new AppError('Saatlik ücret negatif olamaz.', 400);
      }

      if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
        throw new AppError('Geçersiz koordinatlar.', 400);
      }

      const lot = await this.parkingLotRepository.create({
        name,
        latitude,
        longitude,
        address,
        workingHours,
        capacity,
        hourlyRate,
        providerId,
      });

      Logger.info('Parking lot created', {
        parkingLotId: lot.id,
        name,
        providerId,
      });

      return {
        id: lot.id,
        name: lot.name,
        latitude: lot.latitude,
        longitude: lot.longitude,
        address: lot.address,
        workingHours: lot.workingHours,
        currentOccupancy: lot.currentOccupancy,
        capacity: lot.capacity,
        hourlyRate: lot.hourlyRate,
        availableCapacity: lot.capacity, // New lot — all capacity available
        occupancyStatus: 'GREEN' as OccupancyStatus, // New lot is always empty
        providerId: lot.providerId,
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      Logger.error('Error creating parking lot', error as Error);
      throw new AppError('Otopark oluşturulurken hata oluştu.', 500);
    }
  }

  /**
   * Update parking lot details
   */
  async updateParkingLot(
    parkingLotId: number,
    updates: {
      name?: string;
      latitude?: number;
      longitude?: number;
      address?: string;
      workingHours?: string;
      capacity?: number;
      hourlyRate?: number;
    }
  ): Promise<ParkingLotDetailResponse> {
    try {
      // Validate updates
      if (updates.capacity && updates.capacity < 1) {
        throw new AppError('Kapasite en az 1 olmalıdır.', 400);
      }

      if (updates.hourlyRate && updates.hourlyRate < 0) {
        throw new AppError('Saatlik ücret negatif olamaz.', 400);
      }

      if (updates.latitude || updates.longitude) {
        const lat = updates.latitude || 0;
        const lng = updates.longitude || 0;
        if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
          throw new AppError('Geçersiz koordinatlar.', 400);
        }
      }

      const lot = await this.parkingLotRepository.update(parkingLotId, updates);

      const availableCapacity =
        await this.parkingLotRepository.getAvailableCapacity(parkingLotId);

      Logger.info('Parking lot updated', {
        parkingLotId,
        updates,
      });

      return {
        id: lot.id,
        name: lot.name,
        latitude: lot.latitude,
        longitude: lot.longitude,
        address: lot.address,
        workingHours: lot.workingHours,
        currentOccupancy: lot.currentOccupancy,
        capacity: lot.capacity,
        hourlyRate: lot.hourlyRate,
        availableCapacity,
        occupancyStatus: this.computeOccupancyStatus(lot.capacity, availableCapacity),
        providerId: lot.providerId,
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      Logger.error('Error updating parking lot', error as Error);
      throw new AppError('Otopark güncellenirken hata oluştu.', 500);
    }
  }

  /**
   * Update current occupancy manually (simulation / admin)
   */
  async updateOccupancy(
    parkingLotId: number,
    currentOccupancy: number
  ): Promise<ParkingLotDetailResponse> {
    try {
      if (currentOccupancy < 0) {
        throw new AppError('Doluluk negatif olamaz.', 400);
      }

      const lot = await this.parkingLotRepository.findById(parkingLotId);
      if (!lot) {
        throw new AppError('Otopark bulunamadı.', 404);
      }

      // Update the currentOccupancy
      const updatedLot = await this.parkingLotRepository.update(parkingLotId, {
        currentOccupancy
      });

      const availableCapacity =
        await this.parkingLotRepository.getAvailableCapacity(parkingLotId);

      Logger.info('Parking lot occupancy manually updated', {
        parkingLotId,
        currentOccupancy,
      });

      return {
        id: updatedLot.id,
        name: updatedLot.name,
        latitude: updatedLot.latitude,
        longitude: updatedLot.longitude,
        address: updatedLot.address,
        workingHours: updatedLot.workingHours,
        currentOccupancy: updatedLot.currentOccupancy,
        capacity: updatedLot.capacity,
        hourlyRate: updatedLot.hourlyRate,
        availableCapacity,
        occupancyStatus: this.computeOccupancyStatus(updatedLot.capacity, availableCapacity),
        providerId: updatedLot.providerId,
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      Logger.error('Error updating occupancy', error as Error);
      throw new AppError('Otopark doluluğu güncellenirken hata oluştu.', 500);
    }
  }
}
