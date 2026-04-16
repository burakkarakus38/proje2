import { z } from 'zod';

/**
 * Reservation Request Schemas - Per backend-rules.md
 * All input validation uses Zod for type safety and consistency
 */

/** Create Reservation Schema */
export const createReservationSchema = z.object({
  body: z.object({
    vehicleId: z
      .number()
      .int('Araç ID tam sayı olmalıdır.')
      .min(1, 'Geçerli bir araç ID giriniz.'),
    parkingLotId: z
      .number()
      .int('Otopark ID tam sayı olmalıdır.')
      .min(1, 'Geçerli bir otopark ID giriniz.'),
    startTime: z
      .string()
      .datetime('Başlangıç zamanı ISO 8601 formatında olmalıdır.')
      .refine(
        (val) => new Date(val) > new Date(),
        'Başlangıç zamanı gelecekte olmalıdır.'
      ),
    // Support both endTime (for backward compatibility) and plannedDuration (new)
    endTime: z
      .string()
      .datetime('Bitiş zamanı ISO 8601 formatında olmalıdır.')
      .optional(),
    plannedDuration: z
      .number()
      .min(1, 'Planlanan süre en az 1 saat olmalıdır.')
      .max(24 * 30, 'Planlanan süre en fazla 30 gün olabilir.')
      .optional(),
  }).refine(
    (data) => data.endTime || data.plannedDuration,
    {
      message: 'Bitiş zamanı veya planlanan süre gereklidir.',
      path: ['endTime'],
    }
  ).refine(
    (data) => {
      if (!data.endTime) return true; // Skip if using plannedDuration
      return new Date(data.endTime) > new Date(data.startTime);
    },
    {
      message: 'Bitiş zamanı başlangıç zamanından sonra olmalıdır.',
      path: ['endTime'],
    }
  ),
});

export type CreateReservationRequest = z.infer<typeof createReservationSchema>;

/** Get Reservation Schema */
export const getReservationSchema = z.object({
  params: z.object({
    reservationId: z
      .string()
      .transform((val) => parseInt(val))
      .refine((val) => val > 0, 'Geçerli bir rezervasyon ID giriniz.'),
  }),
});

export type GetReservationRequest = z.infer<typeof getReservationSchema>;

/** Cancel Reservation Schema */
export const cancelReservationSchema = z.object({
  params: z.object({
    reservationId: z
      .string()
      .transform((val) => parseInt(val))
      .refine((val) => val > 0, 'Geçerli bir rezervasyon ID giriniz.'),
  }),
});

export type CancelReservationRequest = z.infer<typeof cancelReservationSchema>;

/** Get User Reservations Schema */
export const getUserReservationsSchema = z.object({
  query: z.object({
    status: z
      .enum(['PENDING', 'ACTIVE', 'COMPLETED', 'CANCELLED'])
      .optional(),
    limit: z
      .string()
      .transform((val) => parseInt(val))
      .refine((val) => val > 0 && val <= 100, 'Limit 1-100 arasında olmalıdır.')
      .optional(),
    offset: z
      .string()
      .transform((val) => parseInt(val))
      .refine((val) => val >= 0, 'Offset 0 veya daha büyük olmalıdır.')
      .optional(),
  }),
});

export type GetUserReservationsRequest = z.infer<typeof getUserReservationsSchema>;
