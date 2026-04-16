/**
 * src/types.ts
 *
 * Proje genelinde kullanılan ortak tip tanımları bu dosyada toplanır.
 * Express.Request genişletmesi artık src/types/express.d.ts dosyasında yönetilmektedir.
 *
 * @see src/types/express.d.ts — Express Request augmentation
 */

declare global {
  namespace Express {
    interface Request {
      id?: string;
      userId?: string | number;
    }
  }
}

// ── JWT Payload ──────────────────────────────────────────────────────────────

export interface JwtPayload {
  /** Kullanıcının benzersiz ID'si */
  userId: string | number;
  /** Kullanıcının rolü */
  role?: string;
  /** Kullanıcının GSM / telefon numarası */
  gsm?: string;
  /** Kullanıcının e-posta adresi */
  email?: string;
  /** Token'ın son kullanma zamanı (Unix timestamp) */
  exp?: number;
  /** Token'ın oluşturulma zamanı (Unix timestamp) */
  iat?: number;
}

// ── API Response ─────────────────────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

// ── Pagination ───────────────────────────────────────────────────────────────

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
