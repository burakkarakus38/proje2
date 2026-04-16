import prisma from '../Models';
import { AppError } from '../Utils/AppError';
import { Logger } from '../Utils/logger';
import { hashPassword, comparePasswords } from '../Utils/bcryptUtils';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from '../Utils/jwtUtils';
import { generateOTP } from '../Utils/generateOTP';

/**
 * Authentication Service
 * Per backend-rules.md: Business logic resides ONLY in Services layer
 * This service handles login, register, token management
 */

export interface AuthPayload {
  email: string;
  gsm?: string;
  password: string;
}

export interface RegisterPayload extends AuthPayload {
  name: string;
  gsm: string;
}

export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
}

export interface UserLoginResponse {
  user: {
    id: number;
    email: string;
    gsm: string;
    name: string | null;
    role: string;
  };
  accessToken: string;
  refreshToken: string;
}

export interface UserRegisterResponse {
  user: {
    id: number;
    email: string;
    gsm: string;
    name: string | null;
    role: string;
  };
  accessToken: string;
  refreshToken: string;
  verificationCode?: string;
}

export interface VerifyOTPResponse {
  user: {
    id: number;
    email: string;
    gsm: string;
    name: string | null;
    role: string;
    isVerified: boolean;
  };
  accessToken: string;
  refreshToken: string;
}

const OTP_TTL_MS = 2 * 60 * 1000; // 2 minutes

const normalizeGSM = (gsm: string): string => {
  const cleaned = gsm.replace(/\D/g, '');
  return cleaned.startsWith('0') ? cleaned.substring(1) : cleaned;
};

export class AuthService {
  /**
   * User registration
   * 1. Check if user exists (by email or gsm)
   * 2. Validate role and conditional vehicle fields
   * 3. Hash password using bcryptUtils.hashPassword()
   * 4. Generate SMS verification code
   * 5. Create new user in database
   * 6. Conditionally create vehicle (only for USER/DRIVER role)
   * 7. Generate accessToken & refreshToken
   * 8. Save refreshToken to database
   * 9. Return user data (without password) + tokens
   *
   * @param name User full name
   * @param email User email
   * @param gsm User phone number
   * @param password User password
   * @param role User role (USER/DRIVER, OPERATOR/MANAGER, ADMIN)
   * @param vehiclePlate Vehicle plate (required for DRIVER/USER role)
   * @param vehicleBrand Vehicle brand (required for DRIVER/USER role)
   * @param vehicleModel Vehicle model (required for DRIVER/USER role)
   * @returns Newly created user with tokens
   */
  async register(
    name: string,
    email: string,
    gsm: string,
    password: string,
    role: string = 'USER',
    vehiclePlate?: string,
    vehicleBrand?: string,
    vehicleModel?: string
  ): Promise<UserRegisterResponse> {
    try {
      Logger.debug('Register service called', { email, gsm, name, role });
      const normalizedGsm = normalizeGSM(gsm);

      // 1. Check if user already exists by email or gsm
      const existingUser = await prisma.user.findFirst({
        where: {
          OR: [
            { email },
            { gsm: normalizedGsm },
          ],
        },
      });

      if (existingUser) {
        if (existingUser.email === email) {
          throw new AppError(
            'Bu e-posta adresi zaten kayıtlı. Lütfen giriş yapın.',
            409
          );
        } else {
          throw new AppError(
            'Bu telefon numarası zaten kayıtlı. Lütfen giriş yapın.',
            409
          );
        }
      }

      // 2. Normalize role and validate vehicle fields for DRIVER
      const normalizedRole: 'USER' | 'OPERATOR' | 'ADMIN' = (role && ['OPERATOR', 'ADMIN'].includes(role)) ? (role as 'OPERATOR' | 'ADMIN') : 'USER';
      
      if (normalizedRole === 'USER' && (!vehiclePlate || !vehicleBrand || !vehicleModel)) {
        throw new AppError(
          'Şoför rolü için plaka, marka ve model bilgileri gereklidir.',
          400
        );
      }

      // 3. Hash password
      const hashedPassword = await hashPassword(password);

      // 4. Generate SMS verification code (simulation: always "1234") and set 2-min TTL
      const otpCode = generateOTP();
      const otpExpiresAt = new Date(Date.now() + OTP_TTL_MS);

      // 5-6. Create new user in database with conditional vehicle
      const newUser = await prisma.user.create({
        data: {
          email,
          gsm,
          name,
          password: hashedPassword,
          role: normalizedRole,
          otpCode,
          otpExpiresAt,
          // Only create vehicle if role is USER (DRIVER)
          ...(normalizedRole === 'USER' && vehiclePlate && vehicleBrand && vehicleModel ? {
            vehicles: {
              create: {
                plate: vehiclePlate,
                brand: vehicleBrand,
                model: vehicleModel,
                type: 'CAR',
              },
            },
          } : {}),
        },
        select: {
          id: true,
          email: true,
          gsm: true,
          name: true,
          role: true,
        },
      });

      // 7. Generate tokens
      const accessToken = generateAccessToken({
        userId: newUser.id,
        email: newUser.email,
        role: newUser.role,
      });

      const refreshToken = generateRefreshToken({
        userId: newUser.id,
        email: newUser.email,
        role: newUser.role,
      });

      // 8. Save refresh token to database
      // Calculate expiration date (7 days from now)
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      await prisma.refreshToken.create({
        data: {
          userId: newUser.id,
          token: refreshToken,
          expiresAt,
        },
      });

      Logger.debug('User registered successfully', { userId: newUser.id, role: normalizedRole });

      // 9. Return user data + tokens (verificationCode exposed so test clients can simulate SMS)
      return {
        user: newUser,
        accessToken,
        refreshToken,
        verificationCode: otpCode,
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      Logger.error('Register service error', error as Error);
      throw new AppError('Kayıt işlemi sırasında bir hata oluştu.', 500);
    }
  }

  /**
   * User login
   * 1. Find user by email or gsm
   * 2. Verify password using bcryptUtils.comparePasswords()
   * 3. Generate accessToken & refreshToken using jwtUtils
   * 4. Save refreshToken to database
   * 5. Return token pair and user data
   *
   * @param email User email (optional if gsm provided)
   * @param gsm User phone number (optional if email provided)
   * @param password User password
   * @returns Token pair and user data
   */
  async login(
    password: string,
    email?: string,
    gsm?: string
  ): Promise<UserLoginResponse> {
    try {
      Logger.debug('Login service called', { email, gsm });

      // 1. Find user by email or gsm
      const user = await prisma.user.findFirst({
        where: {
          OR: [
            ...(email ? [{ email }] : []),
            ...(gsm ? [{ gsm }] : []),
          ],
        },
        select: {
          id: true,
          email: true,
          gsm: true,
          name: true,
          role: true,
          password: true,
        },
      });

      if (!user) {
        throw new AppError(
          'E-posta, telefon numarası veya şifre hatalı. Lütfen kontrol edin.',
          401
        );
      }

      // 2. Verify password
      const isPasswordValid = await comparePasswords(password, user.password);

      if (!isPasswordValid) {
        throw new AppError(
          'E-posta, telefon numarası veya şifre hatalı. Lütfen kontrol edin.',
          401
        );
      }

      // 3. Generate tokens
      const accessToken = generateAccessToken({
        userId: user.id,
        email: user.email,
        role: user.role,
      });

      const refreshToken = generateRefreshToken({
        userId: user.id,
        email: user.email,
        role: user.role,
      });

      // 4. Save refresh token to database
      // Calculate expiration date (7 days from now)
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      // Delete old refresh token if exists and create new one
      await prisma.refreshToken.deleteMany({
        where: { userId: user.id },
      });

      await prisma.refreshToken.create({
        data: {
          userId: user.id,
          token: refreshToken,
          expiresAt,
        },
      });

      Logger.debug('User logged in successfully', { userId: user.id });

      // 5. Return user data (password excluded) + tokens
      const { password: _, ...userWithoutPassword } = user;
      return {
        user: userWithoutPassword,
        accessToken,
        refreshToken,
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      Logger.error('Login service error', error as Error);
      throw new AppError('Giriş işlemi sırasında bir hata oluştu.', 500);
    }
  }

  /**
   * Refresh JWT Token
   * 1. Verify refreshToken using jwtUtils.verifyRefreshToken()
   * 2. Check if token exists in database and not revoked
   * 3. Generate new accessToken
   * 4. Generate new refreshToken
   * 5. Update database (delete old, save new refreshToken)
   * 6. Return new token pair
   *
   * @param refreshToken Previous refresh token
   * @returns New token pair
   */
  async refreshToken(refreshToken: string): Promise<TokenResponse> {
    try {
      Logger.debug('Refresh token service called');

      // 1. Verify refresh token signature
      let tokenPayload;
      try {
        tokenPayload = verifyRefreshToken(refreshToken);
      } catch (error) {
        throw new AppError(
          'Geçersiz veya süresi dolmuş refresh token. Lütfen tekrar giriş yapın.',
          401
        );
      }

      // 2. Check if token exists in database and not revoked
      const storedToken = await prisma.refreshToken.findFirst({
        where: {
          userId: Number(tokenPayload.userId),
          token: refreshToken,
          revokedAt: null, // Not revoked
        },
      });

      if (!storedToken) {
        throw new AppError(
          'Refresh token bulunamadı veya iptal edilmiş. Lütfen tekrar giriş yapın.',
          401
        );
      }

      // Check if token is expired
      if (new Date() > storedToken.expiresAt) {
        throw new AppError(
          'Refresh token süresi dolmuş. Lütfen tekrar giriş yapın.',
          401
        );
      }

      // 3. Generate new access token
      const newAccessToken = generateAccessToken({
        userId: tokenPayload.userId,
        email: tokenPayload.email,
      });

      // 4. Generate new refresh token
      const newRefreshToken = generateRefreshToken({
        userId: tokenPayload.userId,
        email: tokenPayload.email,
      });

      // 5. Update database: delete old refresh token and save new one
      const newExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      await prisma.refreshToken.delete({
        where: { id: storedToken.id },
      });

      await prisma.refreshToken.create({
        data: {
          userId: Number(tokenPayload.userId),
          token: newRefreshToken,
          expiresAt: newExpiresAt,
        },
      });

      Logger.debug('Token refreshed successfully', {
        userId: tokenPayload.userId,
      });

      // 6. Return new token pair
      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      Logger.error('Refresh token service error', error as Error);
      throw new AppError(
        'Token yenileme işlemi sırasında bir hata oluştu.',
        500
      );
    }
  }

  /**
   * Verify GSM OTP code sent during registration.
   *
   * Steps:
   *   1. Find user by gsm — must exist and not yet verified.
   *   2. Validate the submitted OTP against the stored code (case spec: fixed "1234").
   *   3. Enforce 2-minute TTL on the stored otpExpiresAt.
   *   4. Mark user as verified and clear OTP fields.
   *   5. Generate JWT access token with userId, email, role, and gsm in payload.
   *   6. Issue refresh token, persist it, and return the full token pair.
   *
   * @param gsm  The user's registered GSM number
   * @param otp  OTP submitted by the user (simulation: "1234")
   * @returns Verified user profile + token pair
   */
  async verifyOTP(gsm: string, otp: string): Promise<VerifyOTPResponse> {
    try {
      const normalizedGsm = normalizeGSM(gsm);
      Logger.debug('OTP verification called', { gsm: normalizedGsm });

      // Step 1 — fetch user with OTP fields
      const user = await prisma.user.findUnique({
        where: { gsm: normalizedGsm },
        select: {
          id: true,
          email: true,
          gsm: true,
          name: true,
          role: true,
          isVerified: true,
          otpCode: true,
          otpExpiresAt: true,
        },
      });

      if (!user) {
        throw new AppError(
          'Bu GSM numarası ile kayıtlı bir kullanıcı bulunamadı.',
          404
        );
      }

      if (user.isVerified) {
        throw new AppError('Bu hesap zaten doğrulanmış.', 400);
      }

      // Step 2 — validate OTP code
      if (!user.otpCode || user.otpCode !== otp) {
        throw new AppError(
          'Geçersiz doğrulama kodu. Lütfen SMS ile gelen kodu girin.',
          400
        );
      }

      // Step 3 — enforce TTL
      if (!user.otpExpiresAt || new Date() > user.otpExpiresAt) {
        throw new AppError(
          'Doğrulama kodunun süresi dolmuş (2 dakika). Lütfen yeniden kayıt olun veya yeni kod isteyin.',
          400
        );
      }

      // Step 4 — mark verified, clear OTP fields
      await prisma.user.update({
        where: { id: user.id },
        data: { isVerified: true, otpCode: null, otpExpiresAt: null },
      });

      // Step 5 — generate access token (payload includes role + gsm per case spec)
      const tokenPayload = {
        userId: user.id,
        email: user.email,
        role: user.role,
        gsm: user.gsm,
      };
      const accessToken = generateAccessToken(
        tokenPayload as Parameters<typeof generateAccessToken>[0]
      );

      // Step 6 — generate and persist refresh token
      const refreshToken = generateRefreshToken(
        tokenPayload as Parameters<typeof generateRefreshToken>[0]
      );

      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      await prisma.refreshToken.deleteMany({ where: { userId: user.id } });
      await prisma.refreshToken.create({
        data: { userId: user.id, token: refreshToken, expiresAt },
      });

      Logger.info('OTP verified successfully', { userId: user.id });

      return {
        user: {
          id: user.id,
          email: user.email,
          gsm: user.gsm,
          name: user.name,
          role: user.role,
          isVerified: true,
        },
        accessToken,
        refreshToken,
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      Logger.error('OTP verification error', error as Error);
      throw new AppError('Doğrulama işlemi sırasında bir hata oluştu.', 500);
    }
  }

  /**
   * Request Login OTP (SMS Login - Step 1)
   */
  async requestLoginOTP(gsm: string): Promise<{ gsm: string; verificationCode: string }> {
    try {
      const normalizedGsm = normalizeGSM(gsm);
      const user = await prisma.user.findUnique({ where: { gsm: normalizedGsm } });
      if (!user) throw new AppError('Bu numara ile kayıtlı bir hesap bulunamadı.', 404);

      const otpCode = generateOTP();
      const otpExpiresAt = new Date(Date.now() + OTP_TTL_MS);

      await prisma.user.update({
        where: { id: user.id },
        data: { otpCode, otpExpiresAt },
      });

      return { gsm: normalizedGsm, verificationCode: otpCode };
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('Giriş kodu gönderilirken bir hata oluştu.', 500);
    }
  }

  /**
   * Verify Login OTP (SMS Login - Step 2)
   */
  async verifyLoginOTP(gsm: string, otp: string): Promise<UserLoginResponse> {
    try {
      const normalizedGsm = normalizeGSM(gsm);
      const user = await prisma.user.findUnique({
        where: { gsm: normalizedGsm },
        select: { id: true, email: true, gsm: true, name: true, role: true, otpCode: true, otpExpiresAt: true }
      });

      if (!user) throw new AppError('Kullanıcı bulunamadı.', 404);
      if (!user.otpCode || user.otpCode !== otp) throw new AppError('Geçersiz doğrulama kodu.', 400);
      if (!user.otpExpiresAt || new Date() > user.otpExpiresAt) throw new AppError('Doğrulama kodunun süresi dolmuş.', 400);

      // Clear OTP
      await prisma.user.update({ where: { id: user.id }, data: { otpCode: null, otpExpiresAt: null } });

      const tokenPayload = { userId: user.id, email: user.email, role: user.role };
      const accessToken = generateAccessToken(tokenPayload as Parameters<typeof generateAccessToken>[0]);
      const refreshToken = generateRefreshToken(tokenPayload as Parameters<typeof generateRefreshToken>[0]);
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      await prisma.refreshToken.deleteMany({ where: { userId: user.id } });
      await prisma.refreshToken.create({ data: { userId: user.id, token: refreshToken, expiresAt } });

      const { otpCode: _, otpExpiresAt: __, ...userWithoutOtp } = user;
      return { user: userWithoutOtp, accessToken, refreshToken };
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('Şifresiz giriş sırasında bir hata oluştu.', 500);
    }
  }

  /**
   * Logout user (revoke refresh token)
   * 1. Find refreshToken in database by userId
   * 2. Delete from database (or mark as revoked)
   *
   * @param userId User ID
   * @param refreshToken Refresh token to revoke
   */
  async logout(userId: string | number, refreshToken: string): Promise<void> {
    try {
      Logger.debug('Logout service called', { userId });

      // 1. Find and delete refresh token
      const result = await prisma.refreshToken.deleteMany({
        where: {
          userId: Number(userId),
          token: refreshToken,
        },
      });

      if (result.count === 0) {
        Logger.warn('Refresh token not found for logout', { userId });
        // Not throwing error - logout is idempotent
        return;
      }

      Logger.debug('User logged out successfully', { userId });
    } catch (error) {
      Logger.error('Logout service error', error as Error);
      throw new AppError('Çıkış işlemi sırasında bir hata oluştu.', 500);
    }
  }
}
