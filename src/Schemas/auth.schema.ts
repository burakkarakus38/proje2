import { z } from 'zod';

/**
 * Auth Request Schemas - Per backend-rules.md
 * All input validation uses Zod for type safety and consistency
 * Schemas are compatible with validateRequest middleware
 */

/** Login Schema */
export const loginSchema = z.object({
  body: z.object({
    gsm: z
      .string()
      .min(1, 'Telefon numarası gereklidir.')
      .regex(/^[0-9]{10,15}$/, 'Geçerli bir telefon numarası giriniz.')
      .optional(),
    email: z
      .string()
      .min(1, 'E-posta adresi gereklidir.')
      .max(254, 'E-posta adresi çok uzundur.')
      .email('Geçerli bir e-posta adresi giriniz.')
      .toLowerCase()
      .optional(),
    password: z
      .string()
      .min(8, 'Şifre en az 8 karakter olmalıdır.')
      .max(128, 'Şifre çok uzundur.'),
  }).refine(
    (data) => data.email || data.gsm,
    'E-posta veya telefon numarası gereklidir.'
  ),
});

export type LoginRequest = z.infer<typeof loginSchema>;

/** Register Schema */
export const registerSchema = z.object({
  body: z.object({
    name: z
      .string()
      .min(2, 'İsim en az 2 karakter olmalıdır.')
      .max(100, 'İsim en fazla 100 karakter olabilir.')
      .trim(),
    email: z
      .string()
      .min(1, 'E-posta adresi gereklidir.')
      .max(254, 'E-posta adresi çok uzundur.')
      .email('Geçerli bir e-posta adresi giriniz.')
      .toLowerCase(),
    gsm: z
      .string()
      .min(1, 'Telefon numarası gereklidir.')
      .regex(/^[0-9]{10,15}$/, 'Geçerli bir telefon numarası giriniz.'),
    password: z
      .string()
      .min(8, 'Şifre en az 8 karakter olmalıdır.')
      .max(128, 'Şifre çok uzundur.'),
    role: z
      .enum(['USER', 'OPERATOR', 'ADMIN'] as const)
      .default('USER')
      .optional(),
    // Vehicle fields: optional, but required for USER (driver) role
    vehiclePlate: z
      .string()
      .min(1, 'Plaka bilgisi gereklidir.')
      .max(20, 'Plaka bilgisi çok uzundur.')
      .optional(),
    vehicleBrand: z
      .string()
      .min(1, 'Araç marka bilgisi gereklidir.')
      .optional(),
    vehicleModel: z
      .string()
      .min(1, 'Araç model bilgisi gereklidir.')
      .optional(),
  }).refine(
    (data) => {
      // If role is USER (driver), vehicle fields are required
      if (!data.role || data.role === 'USER') {
        return data.vehiclePlate && data.vehicleBrand && data.vehicleModel;
      }
      // For OPERATOR and ADMIN, vehicle fields are not required
      return true;
    },
    {
      message: 'Şoför rolü için plaka, marka ve model bilgileri gereklidir.',
      path: ['vehiclePlate'],
    }
  ),
});

export type RegisterRequest = z.infer<typeof registerSchema>;

/** Refresh Token Schema */
export const refreshTokenSchema = z.object({
  body: z.object({
    refreshToken: z
      .string()
      .min(1, 'Refresh token gereklidir.')
      .max(1024, 'Refresh token geçersiz.'),
  }),
});

export type RefreshTokenRequest = z.infer<typeof refreshTokenSchema>;

/** Verify OTP Schema */
export const verifyOTPSchema = z.object({
  body: z.object({
    gsm: z
      .string()
      .min(1, 'Telefon numarası gereklidir.')
      .regex(/^[0-9]{10,15}$/, 'Geçerli bir telefon numarası giriniz.'),
    otp: z
      .string()
      .min(4, 'Doğrulama kodu en az 4 karakter olmalıdır.')
      .max(6, 'Doğrulama kodu en fazla 6 karakter olabilir.'),
  }),
});

export type VerifyOTPRequest = z.infer<typeof verifyOTPSchema>;

/** Request Login OTP Schema (Şifresiz SMS Girişi) */
export const requestLoginOTPSchema = z.object({
  body: z.object({
    gsm: z
      .string()
      .min(1, 'Telefon numarası gereklidir.')
      .regex(/^[0-9]{10,15}$/, 'Geçerli bir telefon numarası giriniz.'),
  }),
});

/** Verify Login OTP Schema (Şifresiz SMS Doğrulaması) */
export const verifyLoginOTPSchema = verifyOTPSchema;

/** Logout Schema */
export const logoutSchema = z.object({
  body: z.object({
    refreshToken: z
      .string()
      .min(1, 'Refresh token gereklidir.')
      .max(1024, 'Refresh token geçersiz.')
      .optional(),
  }),
});

export type LogoutRequest = z.infer<typeof logoutSchema>;
