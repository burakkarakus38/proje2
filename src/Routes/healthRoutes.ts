import { Router } from 'express';
import { getHealth, getHelloWorld } from '../Controllers/healthController';

const router = Router();

/**
 * @swagger
 * /api/health:
 *   get:
 *     tags: [Health]
 *     summary: Sunucu sağlık durumunu kontrol eder
 *     description: Sunucunun çalışır durumda olup olmadığını, uptime ve ortam bilgisini döndürür.
 *     responses:
 *       200:
 *         description: Sunucu sağlıklı
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StandardResponse'
 */
router.get('/health', getHealth);

/**
 * @swagger
 * /api/hello:
 *   get:
 *     tags: [Health]
 *     summary: Hello World endpoint
 *     description: Projenin çalıştığını doğrulamak için basit bir karşılama mesajı döndürür.
 *     responses:
 *       200:
 *         description: Başarılı karşılama mesajı
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StandardResponse'
 */
router.get('/hello', getHelloWorld);

export default router;
