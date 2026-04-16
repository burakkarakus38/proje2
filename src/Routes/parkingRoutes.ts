import { Router } from 'express';
import * as parkingLotController from '../Controllers/parkingLotController';
import { authMiddleware } from '../Middlewares/authMiddleware';
import { checkRole } from '../Middlewares/roleMiddleware';
import { validateRequest } from '../Middlewares/validateRequest';
import {
  findNearbySchema,
  getParkingLotSchema,
  createParkingLotSchema,
  updateParkingLotSchema,
  updateOccupancySchema,
} from '../Schemas/parking.schema';

/**
 * Parking Lot Routes
 * Per backend-rules.md: RESTful API with proper HTTP methods and status codes
 * All responses follow standard format: { success, data, message, timestamp }
 */

const router = Router();

/**
 * @swagger
 * /api/parking:
 *   get:
 *     summary: Tüm otoparkları listele
 *     description: Sistemdeki tüm otoparkların listesini getirir
 *     tags: [Parking]
 *     responses:
 *       200:
 *         description: Başarılı
 */
router.get('/', parkingLotController.getAllParkingLots);

/**
 * @swagger
 * /api/parking/nearby:
 *   get:
 *     summary: Yakında bulunan otoparkları bul
 *     description: Belirli koordinatlara göre radiusKm içindeki otoparkları listeler
 *     tags: [Parking]
 *     parameters:
 *       - in: query
 *         name: latitude
 *         schema:
 *           type: number
 *         required: true
 *         description: Kullanıcının enlem koordinatı (-90 ile 90 arasında)
 *       - in: query
 *         name: longitude
 *         schema:
 *           type: number
 *         required: true
 *         description: Kullanıcının boylam koordinatı (-180 ile 180 arasında)
 *       - in: query
 *         name: radiusKm
 *         schema:
 *           type: number
 *           default: 5
 *         description: Arama yarıçapı km cinsinden (1-50 km)
 *     responses:
 *       200:
 *         description: Başarılı - Yakında otoparklar bulundu
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StandardResponse'
 *       400:
 *         description: Geçersiz koordinatlar veya radius
 *       500:
 *         description: Sunucu hatası
 */
router.get('/nearby', validateRequest(findNearbySchema), parkingLotController.findNearby);

/**
 * @swagger
 * /api/parking/{parkingLotId}:
 *   get:
 *     summary: Otopark detaylarını getir
 *     description: Belirli bir otoparkın detaylı bilgilerine erişir
 *     tags: [Parking]
 *     parameters:
 *       - in: path
 *         name: parkingLotId
 *         schema:
 *           type: integer
 *         required: true
 *         description: Otopark ID
 *     responses:
 *       200:
 *         description: Otopark bilgisi alındı
 *       404:
 *         description: Otopark bulunamadı
 *       500:
 *         description: Sunucu hatası
 */
router.get('/:parkingLotId', validateRequest(getParkingLotSchema), parkingLotController.getParkingLot);

/**
 * @swagger
 * /api/parking:
 *   post:
 *     summary: Yeni otopark oluştur (Sağlayıcı)
 *     description: Sağlayıcı tarafından yeni bir otopark kaydı oluşturulur
 *     tags: [Parking]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, latitude, longitude, capacity, hourlyRate]
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 100
 *               latitude:
 *                 type: number
 *                 minimum: -90
 *                 maximum: 90
 *               longitude:
 *                 type: number
 *                 minimum: -180
 *                 maximum: 180
 *               capacity:
 *                 type: integer
 *                 minimum: 1
 *               hourlyRate:
 *                 type: number
 *                 minimum: 0
 *     responses:
 *       201:
 *         description: Otopark başarıyla oluşturuldu
 *       400:
 *         description: Geçersiz input verisi
 *       401:
 *         description: Kimlik doğrulama başarısız
 *       403:
 *         description: Sadece sağlayıcılar otopark oluşturabilir
 *       500:
 *         description: Sunucu hatası
 */
router.post(
  '/',
  authMiddleware,
  checkRole(['PROVIDER', 'ADMIN']),
  validateRequest(createParkingLotSchema),
  parkingLotController.createParkingLot
);

/**
 * @swagger
 * /api/parking/{parkingLotId}:
 *   put:
 *     summary: Otopark bilgisini güncelle (Sağlayıcı/Admin)
 *     description: Otoparkın detaylarını güncelleyen endpoint
 *     tags: [Parking]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: parkingLotId
 *         schema:
 *           type: integer
 *         required: true
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               latitude:
 *                 type: number
 *               longitude:
 *                 type: number
 *               capacity:
 *                 type: integer
 *               hourlyRate:
 *                 type: number
 *     responses:
 *       200:
 *         description: Otopark başarıyla güncellendi
 *       400:
 *         description: Geçersiz input verisi
 *       401:
 *         description: Kimlik doğrulama başarısız
 *       403:
 *         description: Yetki yetersiz
 *       404:
 *         description: Otopark bulunamadı
 *       500:
 *         description: Sunucu hatası
 */
router.put(
  '/:parkingLotId',
  authMiddleware,
  checkRole(['PROVIDER', 'ADMIN']),
  validateRequest(updateParkingLotSchema),
  parkingLotController.updateParkingLot
);

/**
 * @swagger
 * /api/parking/provider/{providerId}:
 *   get:
 *     summary: Sağlayıcının otoparkları listele
 *     description: Belirli bir sağlayıcıya ait tüm otoparkları getir
 *     tags: [Parking]
 *     parameters:
 *       - in: path
 *         name: providerId
 *         schema:
 *           type: integer
 *         required: true
 *     responses:
 *       200:
 *         description: Otoparklar alındı
 *       404:
 *         description: Sağlayıcı bulunamadı
 *       500:
 *         description: Sunucu hatası
 */
router.get('/provider/:providerId', parkingLotController.getProviderParkingLots);

/**
 * @swagger
 * /api/parking/{parkingLotId}/occupancy:
 *   patch:
 *     summary: Otopark doluluğunu güncelle (Admin/Provider)
 *     description: Otoparkın doluluk durumunu manuel olarak günceller
 *     tags: [Parking]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: parkingLotId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [currentOccupancy]
 *             properties:
 *               currentOccupancy:
 *                 type: integer
 *                 minimum: 0
 *     responses:
 *       200:
 *         description: Otopark doluluğu başarıyla güncellendi
 *       400:
 *         description: Geçersiz veri
 *       401:
 *         description: Yetkisiz
 *       404:
 *         description: Otopark bulunamadı
 */
router.patch(
  '/:parkingLotId/occupancy',
  authMiddleware,
  checkRole(['PROVIDER', 'ADMIN']),
  validateRequest(updateOccupancySchema),
  parkingLotController.updateOccupancy
);

export default router;
