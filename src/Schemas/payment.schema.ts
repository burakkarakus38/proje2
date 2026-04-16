import { z } from 'zod';

/**
 * Parking Session & Payment Request Schemas - Per backend-rules.md
 * All input validation uses Zod for type safety and consistency
 */

/** Record Entry Schema */
export const recordEntrySchema = z.object({
  body: z.object({
    reservationId: z
      .number()
      .int('Rezervasyon ID tam sayı olmalıdır.')
      .min(1, 'Geçerli bir rezervasyon ID giriniz.'),
    vehicleId: z
      .number()
      .int('Araç ID tam sayı olmalıdır.')
      .min(1, 'Geçerli bir araç ID giriniz.'),
    parkingLotId: z
      .number()
      .int('Otopark ID tam sayı olmalıdır.')
      .min(1, 'Geçerli bir otopark ID giriniz.'),
  }),
});

export type RecordEntryRequest = z.infer<typeof recordEntrySchema>;

/** Record Exit Schema */
export const recordExitSchema = z.object({
  body: z.object({
    parkingSessionId: z
      .number()
      .int('Park oturumu ID tam sayı olmalıdır.')
      .min(1, 'Geçerli bir park oturumu ID giriniz.'),
    paymentMethod: z
      .enum(['CREDIT_CARD', 'DEBIT_CARD', 'BANK_TRANSFER', 'WALLET'] as const)
      .refine(
        (val) => ['CREDIT_CARD', 'DEBIT_CARD', 'BANK_TRANSFER', 'WALLET'].includes(val),
        { message: 'Geçerli bir ödeme yöntemi seçiniz: CREDIT_CARD, DEBIT_CARD, BANK_TRANSFER, WALLET.' }
      ),
  }),
});

export type RecordExitRequest = z.infer<typeof recordExitSchema>;

/** Get Session Details Schema */
export const getSessionSchema = z.object({
  params: z.object({
    parkingSessionId: z
      .string()
      .transform((val) => parseInt(val))
      .refine((val) => val > 0, 'Geçerli bir park oturumu ID giriniz.'),
  }),
});

export type GetSessionRequest = z.infer<typeof getSessionSchema>;

/** Get Active Session Schema */
export const getActiveSessionSchema = z.object({
  params: z.object({
    vehicleId: z
      .string()
      .transform((val) => parseInt(val))
      .refine((val) => val > 0, 'Geçerli bir araç ID giriniz.'),
  }),
});

export type GetActiveSessionRequest = z.infer<typeof getActiveSessionSchema>;

/** Process Payment Schema */
export const processPaymentSchema = z.object({
  params: z.object({
    paymentId: z
      .string()
      .transform((val) => parseInt(val))
      .refine((val) => val > 0, 'Geçerli bir ödeme ID giriniz.'),
  }),
  body: z.object({
    transactionId: z
      .string()
      .min(1, 'İşlem ID gereklidir.')
      .max(100, 'İşlem ID çok uzun.')
      .optional(),
  }),
});

export type ProcessPaymentRequest = z.infer<typeof processPaymentSchema>;

/** Get Payment Schema */
export const getPaymentSchema = z.object({
  params: z.object({
    paymentId: z
      .string()
      .transform((val) => parseInt(val))
      .refine((val) => val > 0, 'Geçerli bir ödeme ID giriniz.'),
  }),
});

export type GetPaymentRequest = z.infer<typeof getPaymentSchema>;

/** Get Reservation Payments Schema */
export const getReservationPaymentsSchema = z.object({
  params: z.object({
    reservationId: z
      .string()
      .transform((val) => parseInt(val))
      .refine((val) => val > 0, 'Geçerli bir rezervasyon ID giriniz.'),
  }),
});

export type GetReservationPaymentsRequest = z.infer<typeof getReservationPaymentsSchema>;

/** Get Payment Statistics Schema */
export const getPaymentStatsSchema = z.object({
  query: z.object({
    startDate: z
      .string()
      .datetime('Başlangıç tarihi ISO 8601 formatında olmalıdır.'),
    endDate: z
      .string()
      .datetime('Bitiş tarihi ISO 8601 formatında olmalıdır.'),
  }).refine(
    (data) => new Date(data.endDate) >= new Date(data.startDate),
    {
      message: 'Bitiş tarihi başlangıç tarihinden sonra veya eşit olmalıdır.',
      path: ['endDate'],
    }
  ),
});

export type GetPaymentStatsRequest = z.infer<typeof getPaymentStatsSchema>;
