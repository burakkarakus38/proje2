import { z } from 'zod';

/**
 * Health Check Request Schema
 * Örnek Zod schema dosyası - backend-rules.md'ye uygun
 */

export const healthCheckSchema = z.object({
  body: z.object({}).optional(),
  query: z.object({}).optional(),
  params: z.object({}).optional(),
});

export type HealthCheckRequest = z.infer<typeof healthCheckSchema>;

/**
 * Örnek: User Create Schema
 * Bu schema gerçek projede Users için kullanılacak
 */
export const createUserSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'İsim en az 2 karakter olmalıdır'),
    email: z.string().email('Geçerli bir e-posta adresi giriniz'),
    password: z.string().min(8, 'Şifre en az 8 karakter olmalıdır'),
    age: z.number().int().min(18, 'Yaş 18 ve üzeri olmalıdır').optional(),
  }),
});

export type CreateUserRequest = z.infer<typeof createUserSchema>;
