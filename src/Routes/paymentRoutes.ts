import { Router } from 'express';
import * as paymentController from '../Controllers/paymentController';
import { authMiddleware } from '../Middlewares/authMiddleware';
import { checkRole, requireAdmin } from '../Middlewares/roleMiddleware';
import { validateRequest } from '../Middlewares/validateRequest';
import {
  recordEntrySchema,
  recordExitSchema,
  getSessionSchema,
  getActiveSessionSchema,
  processPaymentSchema,
  getPaymentSchema,
  getReservationPaymentsSchema,
  getPaymentStatsSchema,
} from '../Schemas/payment.schema';

/**
 * Parking Session & Payment Routes
 * Per backend-rules.md: RESTful API with proper HTTP methods and status codes
 * All responses follow standard format: { success, data, message, timestamp }
 * Authenticated endpoints require valid JWT token
 */

const router = Router();

// ==================== PARKING SESSION ENDPOINTS ====================

/**
 * @swagger
 * /api/parking-sessions/entry:
 *   post:
 *     summary: Araç otoparka girişini kaydet
 *     description: |
 *       Araçın otoparka giriş zamanını kaydeder.
 *       - Rezervasyon doğrulaması yapılır
 *       - Aktif session kontrolü yapılır
 *       - Rezervasyon statüsü ACTIVE'e güncellenir
 *     tags: [Parking Sessions]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [reservationId, vehicleId, parkingLotId]
 *             properties:
 *               reservationId:
 *                 type: integer
 *               vehicleId:
 *                 type: integer
 *               parkingLotId:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Giriş başarıyla kaydedildi
 *       400:
 *         description: Geçersiz input veya araç zaten otoparkta
 *       401:
 *         description: Kimlik doğrulama başarısız
 *       404:
 *         description: Rezervasyon bulunamadı
 *       500:
 *         description: Sunucu hatası
 */
router.post(
  '/entry',
  authMiddleware,
  validateRequest(recordEntrySchema),
  paymentController.recordEntry
);

/**
 * @swagger
 * /api/parking-sessions/{parkingSessionId}/exit:
 *   post:
 *     summary: Araç otoparktan çıkışını kaydet ve ödeme başlat
 *     description: |
 *       Araçın otoparktan çıkış zamanını kaydeder ve ödeme işlemini başlatır.
 *       - Çıkış zamanı kaydedilir
 *       - Parklamadaki süre hesaplanır
 *       - Ücret hesaplanır (saat başına yukarı yuvarlama)
 *       - Payment kaydı PENDING statüsü ile oluşturulur
 *       - Rezervasyon statüsü COMPLETED'e güncellenir
 *     tags: [Parking Sessions]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: parkingSessionId
 *         schema:
 *           type: integer
 *         required: true
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [paymentMethod]
 *             properties:
 *               paymentMethod:
 *                 type: string
 *                 enum: [CREDIT_CARD, DEBIT_CARD, BANK_TRANSFER, WALLET]
 *     responses:
 *       200:
 *         description: Çıkış başarıyla kaydedildi, ödeme tetiklendi
 *       400:
 *         description: Geçersiz input veya session zaten kapalı
 *       401:
 *         description: Kimlik doğrulama başarısız
 *       404:
 *         description: Park oturumu bulunamadı
 *       500:
 *         description: Sunucu hatası
 */
router.post(
  '/:parkingSessionId/exit',
  authMiddleware,
  validateRequest(recordExitSchema),
  paymentController.recordExit
);

/**
 * @swagger
 * /api/parking-sessions/{parkingSessionId}:
 *   get:
 *     summary: Park oturumu detaylarını getir
 *     description: Belirli bir park oturumunun detaylı bilgilerine erişir
 *     tags: [Parking Sessions]
 *     parameters:
 *       - in: path
 *         name: parkingSessionId
 *         schema:
 *           type: integer
 *         required: true
 *     responses:
 *       200:
 *         description: Park oturumu bilgisi alındı
 *       404:
 *         description: Park oturumu bulunamadı
 *       500:
 *         description: Sunucu hatası
 */
router.get(
  '/:parkingSessionId',
  validateRequest(getSessionSchema),
  paymentController.getSessionDetails
);

/**
 * @swagger
 * /api/parking-sessions/vehicle/{vehicleId}/active:
 *   get:
 *     summary: Araçın aktif park oturumunu getir
 *     description: Belirli bir araçın otoparkta aktif bir oturumu varsa getirir
 *     tags: [Parking Sessions]
 *     parameters:
 *       - in: path
 *         name: vehicleId
 *         schema:
 *           type: integer
 *         required: true
 *     responses:
 *       200:
 *         description: Aktif oturum bulundu veya bulunmadı
 *       500:
 *         description: Sunucu hatası
 */
router.get(
  '/vehicle/:vehicleId/active',
  validateRequest(getActiveSessionSchema),
  paymentController.getActiveSession
);

/**
 * @swagger
 * /api/parking-sessions:
 *   get:
 *     summary: Kullanıcının park oturumlarını listele
 *     description: Oturum açmış kullanıcının tüm park oturumlarını pagination ile getir
 *     tags: [Parking Sessions]
 *     security:
 *       - BearerAuth: []
 *     parameters:
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
 *         description: Park oturumları alındı
 *       401:
 *         description: Kimlik doğrulama başarısız
 *       500:
 *         description: Sunucu hatası
 */
router.get('/', authMiddleware, paymentController.getUserSessions);

// ==================== PAYMENT ENDPOINTS ====================

/**
 * @swagger
 * /api/payments/{paymentId}/process:
 *   post:
 *     summary: Ödemeyi işle (tamamla)
 *     description: |
 *       PENDING durumundaki ödemeyi COMPLETED durumuna alır.
 *       Gerçek sistemde ödeme gateway'ine entegrasyon yapılır.
 *     tags: [Payments]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: paymentId
 *         schema:
 *           type: integer
 *         required: true
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               transactionId:
 *                 type: string
 *                 description: Ödeme gateway'inin transaction ID'si
 *     responses:
 *       200:
 *         description: Ödeme başarıyla işlendi
 *       400:
 *         description: Ödeme zaten işlenmiş veya başarısız durumda
 *       401:
 *         description: Kimlik doğrulama başarısız
 *       404:
 *         description: Ödeme kaydı bulunamadı
 *       500:
 *         description: Sunucu hatası
 */
router.post(
  '/:paymentId/process',
  authMiddleware,
  validateRequest(processPaymentSchema),
  paymentController.processPayment
);

/**
 * @swagger
 * /api/payments/{paymentId}:
 *   get:
 *     summary: Ödeme detaylarını getir
 *     description: Belirli bir ödemenin detaylı bilgilerine erişir
 *     tags: [Payments]
 *     parameters:
 *       - in: path
 *         name: paymentId
 *         schema:
 *           type: integer
 *         required: true
 *     responses:
 *       200:
 *         description: Ödeme bilgisi alındı
 *       404:
 *         description: Ödeme kaydı bulunamadı
 *       500:
 *         description: Sunucu hatası
 */
router.get('/:paymentId', validateRequest(getPaymentSchema), paymentController.getPayment);

/**
 * @swagger
 * /api/payments:
 *   get:
 *     summary: Kullanıcının ödeme geçmişini listele
 *     description: Oturum açmış kullanıcının tüm ödemelerini pagination ile getir
 *     tags: [Payments]
 *     security:
 *       - BearerAuth: []
 *     parameters:
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
 *         description: Ödeme geçmişi alındı
 *       401:
 *         description: Kimlik doğrulama başarısız
 *       500:
 *         description: Sunucu hatası
 */
router.get('/', authMiddleware, paymentController.getUserPayments);

/**
 * @swagger
 * /api/reservations/{reservationId}/payments:
 *   get:
 *     summary: Rezervasyonun ödeme kayıtlarını getir
 *     description: Belirli bir rezervasyonla ilişkili tüm ödemeleri getirir
 *     tags: [Payments]
 *     parameters:
 *       - in: path
 *         name: reservationId
 *         schema:
 *           type: integer
 *         required: true
 *     responses:
 *       200:
 *         description: Ödeme kayıtları alındı
 *       404:
 *         description: Rezervasyon bulunamadı
 *       500:
 *         description: Sunucu hatası
 */
router.get(
  '/reservations/:reservationId/payments',
  validateRequest(getReservationPaymentsSchema),
  paymentController.getReservationPayments
);

/**
 * @swagger
 * /api/payments/stats:
 *   get:
 *     summary: Ödeme istatistikleri (Admin)
 *     description: Belirli bir dönem için ödeme istatistiklerini getirir (sadece Admin)
 *     tags: [Payments]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *         required: true
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *         required: true
 *     responses:
 *       200:
 *         description: İstatistikler alındı
 *       400:
 *         description: Geçersiz tarih formatı
 *       401:
 *         description: Kimlik doğrulama başarısız
 *       403:
 *         description: Sadece Admin erişebilir
 *       500:
 *         description: Sunucu hatası
 */
router.get(
  '/stats',
  authMiddleware,
  requireAdmin,
  validateRequest(getPaymentStatsSchema),
  paymentController.getPaymentStats
);

/**
 * @swagger
 * /api/payments/user/spending:
 *   get:
 *     summary: Kullanıcının toplam harcaması
 *     description: Oturum açmış kullanıcının toplam harcadığı tutarı getirir (sadece COMPLETED ödemeler)
 *     tags: [Payments]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Toplam harcama alındı
 *       401:
 *         description: Kimlik doğrulama başarısız
 *       500:
 *         description: Sunucu hatası
 */
router.get('/user/spending', authMiddleware, paymentController.getUserTotalSpending);

/**
 * @swagger
 * /api/payments/{paymentId}/refund:
 *   post:
 *     summary: Ödemeyi geri al (Admin)
 *     description: Tamamlanmış bir ödemeyi geri ödeme (refund) işlemi gerçekleştirir
 *     tags: [Payments]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: paymentId
 *         schema:
 *           type: integer
 *         required: true
 *     responses:
 *       200:
 *         description: Geri ödeme başarıyla işlendi
 *       400:
 *         description: Ödeme geri alınamayan durumda
 *       401:
 *         description: Kimlik doğrulama başarısız
 *       403:
 *         description: Sadece Admin erişebilir
 *       404:
 *         description: Ödeme kaydı bulunamadı
 *       500:
 *         description: Sunucu hatası
 */
router.post(
  '/:paymentId/refund',
  authMiddleware,
  requireAdmin,
  paymentController.processRefund
);

export default router;
