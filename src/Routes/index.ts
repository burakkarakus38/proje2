import { Router } from 'express';
import healthRoutes from './healthRoutes';
import authRoutes from './authRoutes';
import parkingRoutes from './parkingRoutes';
import reservationRoutes from './reservationRoutes';
import paymentRoutes from './paymentRoutes';
import vehicleRoutes from './vehicleRoutes';

const router = Router();

// Health check (public)
router.use('/', healthRoutes);

// Authentication routes (public)
router.use('/auth', authRoutes);

// Vehicle routes (mostly protected)
router.use('/vehicles', vehicleRoutes);

// Parking Lot routes (mostly public, some protected)
router.use('/parking', parkingRoutes);

// Reservation routes (mostly protected)
router.use('/reservations', reservationRoutes);

// Parking Session & Payment routes (mostly protected)
router.use('/parking-sessions', paymentRoutes);
router.use('/payments', paymentRoutes);

export default router;
