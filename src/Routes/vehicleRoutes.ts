import { Router } from 'express';
import { authMiddleware } from '../Middlewares/authMiddleware';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

/**
 * @swagger
 * /api/v1/vehicles:
 *   get:
 *     tags: [Vehicles]
 *     summary: Authenticated user's vehicles
 *     description: Retrieve all vehicles owned by the authenticated user
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of user's vehicles
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: number
 *                       plate:
 *                         type: string
 *                       type:
 *                         type: string
 *                         enum: [CAR, SUV, MOTORCYCLE, TRUCK]
 *                       brand:
 *                         type: string
 *                       model:
 *                         type: string
 *       401:
 *         description: Unauthorized
 */
router.get('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.userId;

    const vehicles = await prisma.vehicle.findMany({
      where: { ownerId: Number(userId) },
      select: {
        id: true,
        plate: true,
        type: true,
        brand: true,
        model: true,
      },
    });

    res.json({
      success: true,
      message: 'Araçlar başarıyla getirildi.',
      data: vehicles,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Araçlar getirilirken bir hata oluştu.',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * @swagger
 * /api/v1/vehicles/{vehicleId}:
 *   get:
 *     tags: [Vehicles]
 *     summary: Get vehicle details
 *     description: Retrieve specific vehicle details (must be owner)
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: vehicleId
 *         schema:
 *           type: number
 *         required: true
 *         description: Vehicle ID
 *     responses:
 *       200:
 *         description: Vehicle details
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - not vehicle owner
 *       404:
 *         description: Vehicle not found
 */
router.get('/:vehicleId', authMiddleware, async (req, res) => {
  try {
    const userId = req.userId;
    const vehicleId = parseInt(String(req.params.vehicleId));

    const vehicle = await prisma.vehicle.findUnique({
      where: { id: vehicleId },
    });

    if (!vehicle) {
      res.status(404).json({
        success: false,
        message: 'Araç bulunamadı.',
      });
      return;
    }

    if (vehicle.ownerId !== userId) {
      res.status(403).json({
        success: false,
        message: 'Bu araçı görüntüleme izniniz yok.',
      });
      return;
    }

    res.json({
      success: true,
      message: 'Araç bilgileri başarıyla getirildi.',
      data: vehicle,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Araç bilgileri getirilirken bir hata oluştu.',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
