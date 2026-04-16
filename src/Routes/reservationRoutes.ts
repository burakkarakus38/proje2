import { Router } from 'express';
import * as reservationController from '../Controllers/reservationController';
import { authMiddleware } from '../Middlewares/authMiddleware';
import { validateRequest } from '../Middlewares/validateRequest';
import {
  createReservationSchema,
  getReservationSchema,
  cancelReservationSchema,
  getUserReservationsSchema,
} from '../Schemas/reservation.schema';

/**
 * Reservation Routes
 * Per backend-rules.md: RESTful API with proper HTTP methods and status codes
 * All responses follow standard format: { success, data, message, timestamp }
 * Authenticated endpoints require valid JWT token
 */

const router = Router();

/**
 * @swagger
 * /api/reservations:
 *   post:
 *     summary: Yeni rezervasyon oluştur
 *     description: |
 *       Kullanıcı için yeni bir otopark rezervasyonu oluşturur.
 *       - Zaman çakışması otomatik kontrol edilir
 *       - Kapasite kontrol edilir
 *       - Ücret hesaplanır (saat başına yukarı yuvarlama)
 *     tags: [Reservations]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [vehicleId, parkingLotId, startTime, endTime]
 *             properties:
 *               vehicleId:
 *                 type: integer
 *                 description: Araç ID
 *               parkingLotId:
 *                 type: integer
 *                 description: Otopark ID
 *               startTime:
 *                 type: string
 *                 format: date-time
 *                 description: Rezervasyon başlangıç zamanı (ISO 8601)
 *               endTime:
 *                 type: string
 *                 format: date-time
 *                 description: Rezervasyon bitiş zamanı (ISO 8601)
 *     responses:
 *       201:
 *         description: Rezervasyon başarıyla oluşturuldu
 *       400:
 *         description: Geçersiz input (zaman sırası, gelecek zaman vb.)
 *       401:
 *         description: Kimlik doğrulama başarısız
 *       409:
 *         description: Zaman çakışması veya kapasite yetersiz
 *       500:
 *         description: Sunucu hatası
 */
router.post(
  '/',
  authMiddleware,
  validateRequest(createReservationSchema),
  reservationController.createReservation
);

/**
 * @swagger
 * /api/reservations:
 *   get:
 *     summary: Kullanıcının rezervasyonlarını listele
 *     description: Oturum açmış kullanıcının tüm rezervasyonlarını pagination ile getir
 *     tags: [Reservations]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, ACTIVE, COMPLETED, CANCELLED]
 *         description: Statüye göre filtreleme (opsiyonel)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *           maximum: 100
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *     responses:
 *       200:
 *         description: Rezervasyonlar alındı
 *       401:
 *         description: Kimlik doğrulama başarısız
 *       500:
 *         description: Sunucu hatası
 */
router.get(
  '/',
  authMiddleware,
  validateRequest(getUserReservationsSchema),
  reservationController.getUserReservations
);

/**
 * @swagger
 * /api/reservations/{reservationId}:
 *   get:
 *     summary: Rezervasyon detaylarını getir
 *     description: Belirli bir rezervasyonun detaylı bilgilerine erişir
 *     tags: [Reservations]
 *     parameters:
 *       - in: path
 *         name: reservationId
 *         schema:
 *           type: integer
 *         required: true
 *         description: Rezervasyon ID
 *     responses:
 *       200:
 *         description: Rezervasyon bilgisi alındı
 *       404:
 *         description: Rezervasyon bulunamadı
 *       500:
 *         description: Sunucu hatası
 */
router.get(
  '/:reservationId',
  validateRequest(getReservationSchema),
  reservationController.getReservation
);

/**
 * @swagger
 * /api/reservations/{reservationId}:
 *   delete:
 *     summary: Rezervasyon iptal et
 *     description: |
 *       Beklemede veya aktif durumda olan rezervasyonları iptal eder.
 *       - Tamamlanan reservasyonlar iptal edilemez
 *       - Zaten iptal edilen reservasyonlar da işlem görmez
 *     tags: [Reservations]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reservationId
 *         schema:
 *           type: integer
 *         required: true
 *     responses:
 *       200:
 *         description: Rezervasyon başarıyla iptal edildi
 *       400:
 *         description: Rezervasyon durumuna göre iptal edilemez
 *       401:
 *         description: Kimlik doğrulama başarısız
 *       404:
 *         description: Rezervasyon bulunamadı
 *       500:
 *         description: Sunucu hatası
 */
router.delete(
  '/:reservationId',
  authMiddleware,
  validateRequest(cancelReservationSchema),
  reservationController.cancelReservation
);

/**
 * @swagger
 * /api/reservations/stats:
 *   get:
 *     summary: Rezervasyon istatistikleri
 *     description: Kullanıcının rezervasyon istatistiklerini getir (toplam, pending, active, vb.)
 *     tags: [Reservations]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: İstatistikler alındı
 *       401:
 *         description: Kimlik doğrulama başarısız
 *       500:
 *         description: Sunucu hatası
 */
router.get('/stats', authMiddleware, reservationController.getReservationStats);

export default router;
