import { Router } from 'express';
import { login, register, refreshToken, logout, verifyOTP } from '../Controllers/authController';
import { validateRequest } from '../Middlewares/validateRequest';
import { authMiddleware } from '../Middlewares/authMiddleware';
import {
  loginSchema,
  registerSchema,
  refreshTokenSchema,
  logoutSchema,
  verifyOTPSchema,
  requestLoginOTPSchema,
  verifyLoginOTPSchema
} from '../Schemas/auth.schema';
import { requestLoginOTP, verifyLoginOTP } from '../Controllers/authController';

const router = Router();

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     tags: [Authentication]
 *     summary: Kullanıcı giriş (Login)
 *     description: |
 *       E-posta ve şifre ile giriş yaparak JWT token'ları alır.
 *       Access Token: 15 dakika geçerli (API isteklerinde kullanılır)
 *       Refresh Token: 7 gün geçerli (yeni access token almak için kullanılır)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *                 description: Kullanıcının e-posta adresi
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 8
 *                 example: "secure_password123"
 *                 description: Kullanıcının şifresi
 *             required:
 *               - email
 *               - password
 *     responses:
 *       200:
 *         description: Başarılı giriş
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StandardResponse'
 *             example:
 *               success: true
 *               data:
 *                 accessToken: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *                 refreshToken: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *                 user:
 *                   id: 1
 *                   email: user@example.com
 *                   name: Ahmet Yılmaz
 *               message: Başarıyla giriş yapıldı.
 *               timestamp: "2026-04-15T16:33:00.000Z"
 *       401:
 *         description: Kimlik doğrulama hatası (e-posta veya şifre yanlış)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StandardResponse'
 *             example:
 *               success: false
 *               data: null
 *               message: E-posta veya şifre yanlış.
 *               timestamp: "2026-04-15T16:33:00.000Z"
 *       422:
 *         description: Validasyon hatası
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StandardResponse'
 *             example:
 *               success: false
 *               data:
 *                 - field: email
 *                   code: invalid_string
 *                   message: Geçerli bir e-posta adresi giriniz.
 *               message: Validasyon hatası. Lütfen gönderilen verileri kontrol edin.
 *               timestamp: "2026-04-15T16:33:00.000Z"
 *       500:
 *         description: Sunucu hatası
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StandardResponse'
 */
/**
 * @swagger
 * /api/auth/verify-otp:
 *   post:
 *     tags: [Authentication]
 *     summary: GSM OTP doğrulama
 *     description: |
 *       Kayıt sırasında SMS ile gönderilen OTP kodunu doğrular.
 *       Simülasyon: sabit kod "1234". TTL: 2 dakika.
 *       Başarılı doğrulama sonrası isVerified=true yapılır ve JWT döndürülür.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [gsm, otp]
 *             properties:
 *               gsm:
 *                 type: string
 *                 example: "05321234567"
 *               otp:
 *                 type: string
 *                 example: "1234"
 *     responses:
 *       200:
 *         description: Doğrulama başarılı
 *       400:
 *         description: Geçersiz veya süresi dolmuş OTP
 *       404:
 *         description: Kullanıcı bulunamadı
 *       422:
 *         description: Validasyon hatası
 */
router.post('/verify-otp', validateRequest(verifyOTPSchema), verifyOTP);

// Şoförler için SMS tabanlı giriş
router.post('/request-login-otp', validateRequest(requestLoginOTPSchema), requestLoginOTP);
router.post('/verify-login-otp', validateRequest(verifyLoginOTPSchema), verifyLoginOTP);

router.post('/login', validateRequest(loginSchema), login);

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     tags: [Authentication]
 *     summary: Yeni kullanıcı kaydı (Register)
 *     description: |
 *       Yeni bir kullanıcı oluşturur ve JWT token'larını döndürür.
 *       E-posta adresi sistem içinde benzersiz olmalıdır.
 *       Şifre bcrypt ile hashlenerek veritabanında saklanır.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 100
 *                 example: Ahmet Yılmaz
 *                 description: Kullanıcının tam adı
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *                 description: Kullanıcının e-posta adresi
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 8
 *                 example: "secure_password123"
 *                 description: Kullanıcının şifresi (en az 8 karakter)
 *             required:
 *               - name
 *               - email
 *               - password
 *     responses:
 *       201:
 *         description: Kullanıcı başarıyla oluşturuldu
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StandardResponse'
 *             example:
 *               success: true
 *               data:
 *                 user:
 *                   id: 1
 *                   email: user@example.com
 *                   name: Ahmet Yılmaz
 *                   createdAt: "2026-04-15T16:33:00.000Z"
 *                 accessToken: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *                 refreshToken: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *               message: Kullanıcı başarıyla oluşturuldu.
 *               timestamp: "2026-04-15T16:33:00.000Z"
 *       409:
 *         description: E-posta zaten kayıtlı
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StandardResponse'
 *             example:
 *               success: false
 *               data: null
 *               message: Bu e-posta adresi zaten kayıtlı.
 *               timestamp: "2026-04-15T16:33:00.000Z"
 *       422:
 *         description: Validasyon hatası
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StandardResponse'
 *       500:
 *         description: Sunucu hatası
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StandardResponse'
 */
router.post('/register', validateRequest(registerSchema), register);

/**
 * @swagger
 * /api/auth/refresh-token:
 *   post:
 *     tags: [Authentication]
 *     summary: Access Token'ı yenile
 *     description: |
 *       Hâlâ geçerli olan Refresh Token kullanarak yeni bir Access Token alır.
 *       Refresh Token veritabanında saklanır ve gerektiğinde iptal edilebilir (revoke).
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *                 description: Yenileme token'ı
 *             required:
 *               - refreshToken
 *     responses:
 *       200:
 *         description: Access Token başarıyla yenilendi
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StandardResponse'
 *             example:
 *               success: true
 *               data:
 *                 accessToken: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *                 refreshToken: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *               message: Token başarıyla yenilendi.
 *               timestamp: "2026-04-15T16:33:00.000Z"
 *       401:
 *         description: Refresh Token geçersiz veya süresi dolmuş
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StandardResponse'
 *             example:
 *               success: false
 *               data: null
 *               message: Token süresi dolmuş. Lütfen yeniden giriş yapın.
 *               timestamp: "2026-04-15T16:33:00.000Z"
 *       422:
 *         description: Validasyon hatası
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StandardResponse'
 *       500:
 *         description: Sunucu hatası
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StandardResponse'
 */
router.post('/refresh-token', validateRequest(refreshTokenSchema), refreshToken);

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     tags: [Authentication]
 *     summary: Kullanıcı çıkışı (Logout)
 *     description: |
 *       Geçerli oturumu sonlandırır ve refresh token'ı iptal eder (revoke).
 *       Bu işlem için geçerli bir JWT Access Token gerekmektedir.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Başarıyla çıkış yapıldı
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StandardResponse'
 *             example:
 *               success: true
 *               data: null
 *               message: Başarıyla çıkış yapıldı.
 *               timestamp: "2026-04-15T16:33:00.000Z"
 *       401:
 *         description: Kimlik doğrulama başarısız (token eksik, geçersiz veya süresi dolmuş)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StandardResponse'
 *             example:
 *               success: false
 *               data: null
 *               message: "Kimlik doğrulama hatası: JWT token bulunamadı veya geçersiz format."
 *               timestamp: "2026-04-15T16:33:00.000Z"
 *       500:
 *         description: Sunucu hatası
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StandardResponse'
 */
router.post('/logout', authMiddleware, validateRequest(logoutSchema), logout);

export default router;
