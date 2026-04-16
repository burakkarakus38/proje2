/**
 * Express Request Interface Augmentation
 * src/types/express.d.ts
 *
 * Express'in Request nesnesini projeye özel alanlarla genişletir.
 * Bu dosya otomatik olarak TypeScript tarafından tanınır (typeRoots veya include ile).
 *
 * Kullanılan alanlar:
 *  - id      : Her isteğe atanan benzersiz UUID (tracing/logging için)
 *  - user    : JWT doğrulamasından sonra authMiddleware tarafından doldurulan kullanıcı bilgisi
 *  - userId  : Geriye dönük uyumluluk için ayrı tutulan kullanıcı ID'si
 *  - token   : Ham JWT token string'i
 */

declare global {
  namespace Express {
    interface Request {
      /** Benzersiz istek ID'si (UUID) — tracing ve logging için */
      id?: string;

      /** JWT'den çözümlenen kullanıcı bilgisi — authMiddleware tarafından set edilir */
      user?: {
        /** Kullanıcının benzersiz ID'si */
        id: string | number;
        /** Kullanıcının rolü: 'ADMIN' | 'USER' | 'PROVIDER' vb. */
        role?: string;
        /** Kullanıcının GSM / telefon numarası */
        gsm?: string;
        /** Kullanıcının e-posta adresi (opsiyonel) */
        email?: string;
      };

      /** Geriye dönük uyumluluk — authMiddleware tarafından set edilir */
      userId?: string | number;

      /** Ham JWT token string'i — authMiddleware tarafından set edilir */
      token?: string;
    }
  }
}

// Bu dosyanın bir modül olarak değil, global declaration olarak işlenmesi için
// boş export zorunludur.
export {};
