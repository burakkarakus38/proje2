import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../Services/authService';
import { sendSuccess } from '../Utils/responseHelper';

/**
 * Authentication Controller
 * Per backend-rules.md: Controllers handle HTTP req/res only — no business logic, no DB queries
 * All business logic delegated to AuthService
 * Response format: { success: boolean, data: any, message: string, timestamp: iso_date }
 */

const authService = new AuthService();

/**
 * Register Handler
 * @route POST /api/auth/register
 * @body { name: string, email: string, gsm: string, password: string, role?: 'USER' | 'OPERATOR' | 'ADMIN', vehiclePlate?: string, vehicleBrand?: string, vehicleModel?: string }
 * @returns { user, accessToken, refreshToken, verificationCode }
 */
export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { name, email, gsm, password, role, vehiclePlate, vehicleBrand, vehicleModel } = req.body;

    const result = await authService.register(
      name, 
      email, 
      gsm, 
      password,
      role,
      vehiclePlate, 
      vehicleBrand, 
      vehicleModel
    );

    // Return 201 Created with user + tokens
    sendSuccess(
      res,
      result,
      'Kullanıcı başarıyla oluşturuldu. SMS doğrulama kodunu kontrol edin.',
      201
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Login Handler
 * @route POST /api/auth/login
 * @body { email?: string, gsm?: string, password: string }
 * @returns { user, accessToken, refreshToken }
 */
export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, gsm, password } = req.body;

    const result = await authService.login(password, email, gsm);

    // Return 200 OK with user + tokens
    sendSuccess(
      res,
      result,
      'Başarıyla giriş yapıldı.',
      200
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Refresh Token Handler
 * @route POST /api/auth/refresh-token
 * @body { refreshToken: string }
 * @returns { accessToken, refreshToken }
 */
export const refreshToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { refreshToken: token } = req.body;

    const result = await authService.refreshToken(token);

    // Return 200 OK with new token pair
    sendSuccess(
      res,
      result,
      'Token başarıyla yenilendi.',
      200
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Verify OTP Handler
 * @route POST /api/auth/verify-otp
 * @body { gsm: string, otp: string }
 * @returns { user, accessToken, refreshToken }
 */
export const verifyOTP = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { gsm, otp } = req.body;

    const result = await authService.verifyOTP(gsm, otp);

    sendSuccess(
      res,
      result,
      'GSM numarası başarıyla doğrulandı.',
      200
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Request Login OTP
 * @route POST /api/auth/request-login-otp
 */
export const requestLoginOTP = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await authService.requestLoginOTP(req.body.gsm);
    sendSuccess(res, result, 'SMS giriş kodu başarıyla gönderildi.', 200);
  } catch (error) { next(error); }
};

/**
 * Verify Login OTP
 * @route POST /api/auth/verify-login-otp
 */
export const verifyLoginOTP = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { gsm, otp } = req.body;
    const result = await authService.verifyLoginOTP(gsm, otp);
    sendSuccess(res, result, 'Şifresiz giriş başarılı.', 200);
  } catch (error) { next(error); }
};

/**
 * Logout Handler
 * @route POST /api/auth/logout
 * @middleware authMiddleware (requires valid JWT access token)
 * @body { refreshToken: string } (refresh token to revoke)
 * @returns { success message }
 */
export const logout = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.userId;
    const { refreshToken } = req.body;

    // Validate required fields — erken çıkış yap
    if (!userId || !refreshToken) {
      sendSuccess(
        res,
        null,
        'Çıkış gerçekleşmiştir. Oturum sonlandırıldı.',
        200
      );
      return;
    }

    await authService.logout(userId as string | number, refreshToken as string);

    // Return 200 OK
    sendSuccess(
      res,
      null,
      'Başarıyla çıkış yapıldı.',
      200
    );
  } catch (error) {
    next(error);
  }
};
