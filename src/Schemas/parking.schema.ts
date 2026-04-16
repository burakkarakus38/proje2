import { z } from 'zod';

/**
 * Parking Lot Request Schemas - Per backend-rules.md
 * All input validation uses Zod for type safety and consistency
 */

/** Find Nearby Parking Lots Schema */
export const findNearbySchema = z.object({
  query: z.object({
    latitude: z
      .string()
      .transform((val) => parseFloat(val))
      .refine(
        (val) => val >= -90 && val <= 90,
        'Latitude -90 ile 90 arasında olmalıdır.'
      ),
    longitude: z
      .string()
      .transform((val) => parseFloat(val))
      .refine(
        (val) => val >= -180 && val <= 180,
        'Longitude -180 ile 180 arasında olmalıdır.'
      ),
    radiusKm: z
      .string()
      .transform((val) => parseFloat(val))
      .refine(
        (val) => val > 0 && val <= 50,
        'Radius 0 ile 50 km arasında olmalıdır.'
      )
      .optional(),
  }),
});

export type FindNearbyRequest = z.infer<typeof findNearbySchema>;

/** Get Parking Lot Details Schema */
export const getParkingLotSchema = z.object({
  params: z.object({
    parkingLotId: z
      .string()
      .transform((val) => parseInt(val))
      .refine((val) => val > 0, 'Geçerli bir otopark ID giriniz.'),
  }),
});

export type GetParkingLotRequest = z.infer<typeof getParkingLotSchema>;

/** Create Parking Lot Schema (Provider only) */
export const createParkingLotSchema = z.object({
  body: z.object({
    name: z
      .string()
      .min(2, 'Otopark adı en az 2 karakter olmalıdır.')
      .max(100, 'Otopark adı en fazla 100 karakter olabilir.')
      .trim(),
    latitude: z
      .number()
      .min(-90, 'Latitude -90 ile 90 arasında olmalıdır.')
      .max(90, 'Latitude -90 ile 90 arasında olmalıdır.'),
    longitude: z
      .number()
      .min(-180, 'Longitude -180 ile 180 arasında olmalıdır.')
      .max(180, 'Longitude -180 ile 180 arasında olmalıdır.'),
    address: z
      .string()
      .min(2, 'Adres en az 2 karakter olmalıdır.'),
    workingHours: z
      .string()
      .min(2, 'Çalışma saatleri en az 2 karakter olmalıdır.'),
    capacity: z
      .number()
      .int('Kapasite tam sayı olmalıdır.')
      .min(1, 'Kapasite en az 1 olmalıdır.')
      .max(10000, 'Kapasite en fazla 10000 olabilir.'),
    hourlyRate: z
      .number()
      .min(0, 'Saatlik ücret negatif olamaz.')
      .max(10000, 'Saatlik ücret en fazla 10000 olabilir.'),
  }),
});

export type CreateParkingLotRequest = z.infer<typeof createParkingLotSchema>;

/** Update Parking Lot Schema */
export const updateParkingLotSchema = z.object({
  params: z.object({
    parkingLotId: z
      .string()
      .transform((val) => parseInt(val))
      .refine((val) => val > 0, 'Geçerli bir otopark ID giriniz.'),
  }),
  body: z.object({
    name: z
      .string()
      .min(2, 'Otopark adı en az 2 karakter olmalıdır.')
      .max(100, 'Otopark adı en fazla 100 karakter olabilir.')
      .trim()
      .optional(),
    latitude: z
      .number()
      .min(-90, 'Latitude -90 ile 90 arasında olmalıdır.')
      .max(90, 'Latitude -90 ile 90 arasında olmalıdır.')
      .optional(),
    longitude: z
      .number()
      .min(-180, 'Longitude -180 ile 180 arasında olmalıdır.')
      .max(180, 'Longitude -180 ile 180 arasında olmalıdır.')
      .optional(),
    address: z
      .string()
      .min(2, 'Adres en az 2 karakter olmalıdır.')
      .optional(),
    workingHours: z
      .string()
      .min(2, 'Çalışma saatleri en az 2 karakter olmalıdır.')
      .optional(),
    capacity: z
      .number()
      .int('Kapasite tam sayı olmalıdır.')
      .min(1, 'Kapasite en az 1 olmalıdır.')
      .optional(),
    hourlyRate: z
      .number()
      .min(0, 'Saatlik ücret negatif olamaz.')
      .optional(),
  }),
});

export type UpdateParkingLotRequest = z.infer<typeof updateParkingLotSchema>;

/** Update Occupancy Schema (Admin/Provider) */
export const updateOccupancySchema = z.object({
  params: z.object({
    parkingLotId: z
      .string()
      .transform((val) => parseInt(val))
      .refine((val) => val > 0, 'Geçerli bir otopark ID giriniz.'),
  }),
  body: z.object({
    currentOccupancy: z
      .number()
      .int('Doluluk tam sayı olmalıdır.')
      .min(0, 'Doluluk negatif olamaz.')
  }),
});

export type UpdateOccupancyRequest = z.infer<typeof updateOccupancySchema>;
