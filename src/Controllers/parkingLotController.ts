import { Request, Response, NextFunction } from 'express';
import { ParkingLotService } from '../Services/parkingLotService';
import { sendSuccess } from '../Utils/responseHelper';

/**
 * Parking Lot Controller
 * Per backend-rules.md: Controllers handle HTTP req/res only — no business logic, no DB queries
 * All business logic delegated to ParkingLotService
 * Response format: { success: boolean, data: any, message: string, timestamp: iso_date }
 */

const parkingLotService = new ParkingLotService();

/**
 * Get all parking lots
 * @route GET /api/parking
 * @returns Array of all parking lots
 */
export const getAllParkingLots = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await parkingLotService.getAllParkingLots();

    sendSuccess(
      res,
      result,
      result.length > 0
        ? 'Tüm otoparklar listelendi.'
        : 'Sistemde kayıtlı otopark bulunamadı.',
      200
    );
  } catch (error) {
    next(error);
  }
};


/**
 * Find nearby parking lots
 * @route GET /api/parking/nearby?latitude=40.1&longitude=29.0&radiusKm=5
 * @param latitude User's latitude
 * @param longitude User's longitude
 * @param radiusKm Search radius in km (optional, default 5km)
 * @returns Array of nearby parking lots with distance
 */
export const findNearby = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { latitude, longitude, radiusKm } = req.query;

    const result = await parkingLotService.findNearby(
      parseFloat(latitude as string),
      parseFloat(longitude as string),
      radiusKm ? parseFloat(radiusKm as string) : 5
    );

    sendSuccess(
      res,
      result,
      result.length > 0
        ? 'Yakında bulunan otoparklar bulundu.'
        : 'Yakında otopark bulunamadı.',
      200
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get parking lot details
 * @route GET /api/parking/:parkingLotId
 * @param parkingLotId Parking lot ID
 * @returns Parking lot details with available capacity
 */
export const getParkingLot = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { parkingLotId } = req.params as { parkingLotId: string };

    const result = await parkingLotService.getParkingLotDetails(
      parseInt(String(parkingLotId))
    );

    if (!result) {
      sendSuccess(res, null, 'Otopark bulunamadı.', 404);
      return;
    }

    sendSuccess(res, result, 'Otopark bilgisi alındı.', 200);
  } catch (error) {
    next(error);
  }
};

/**
 * Create parking lot (Provider only)
 * @route POST /api/parking
 * @middleware authMiddleware, requireProvider
 * @body { name, latitude, longitude, capacity, hourlyRate }
 * @returns Created parking lot details
 */
export const createParkingLot = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { name, latitude, longitude, address, workingHours, capacity, hourlyRate } = req.body;
    const providerId = req.user?.id as number;

    const result = await parkingLotService.createParkingLot(
      name,
      latitude,
      longitude,
      address,
      workingHours,
      capacity,
      hourlyRate,
      providerId
    );

    sendSuccess(
      res,
      result,
      'Otopark başarıyla oluşturuldu.',
      201
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Update parking lot (Provider/Admin only)
 * @route PUT /api/parking/:parkingLotId
 * @middleware authMiddleware, requireProvider or requireAdmin
 * @param parkingLotId Parking lot ID
 * @body { name?, latitude?, longitude?, capacity?, hourlyRate? }
 * @returns Updated parking lot details
 */
export const updateParkingLot = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { parkingLotId } = req.params as { parkingLotId: string };
    const updates = req.body;

    const result = await parkingLotService.updateParkingLot(
      parseInt(String(parkingLotId)),
      updates
    );

    sendSuccess(
      res,
      result,
      'Otopark başarıyla güncellendi.',
      200
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get provider's parking lots
 * @route GET /api/parking/provider/:providerId
 * @param providerId Provider ID
 * @returns Array of parking lots owned by provider
 */
export const getProviderParkingLots = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { providerId } = req.params as { providerId: string };

    const result = await parkingLotService.getParkingLotsByProvider(
      parseInt(String(providerId))
    );

    sendSuccess(
      res,
      result,
      result.length > 0
        ? `${result.length} otopark bulundu.`
        : 'Sağlayıcıya ait otopark bulunamadı.',
      200
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Update current occupancy (Admin/Provider)
 * @route PATCH /api/v1/parking-lots/:parkingLotId/occupancy
 * @middleware authMiddleware, requireProvider or requireAdmin
 * @param parkingLotId Parking lot ID
 * @body { currentOccupancy: number }
 * @returns Updated parking lot details
 */
export const updateOccupancy = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { parkingLotId } = req.params as { parkingLotId: string };
    const { currentOccupancy } = req.body;

    const result = await parkingLotService.updateOccupancy(
      parseInt(String(parkingLotId)),
      currentOccupancy
    );

    sendSuccess(
      res,
      result,
      'Otopark doluluğu başarıyla güncellendi.',
      200
    );
  } catch (error) {
    next(error);
  }
};
