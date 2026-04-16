/**
 * Payment Repository — Data access layer for Payment entity
 * Handles all database operations for payments
 * Per backend-rules.md: Veri tabanı bağlantıları her zaman asenkron (async/await) olmalı
 */

import prisma from '../Models';
import { BaseRepository } from './BaseRepository';
import { Logger } from '../Utils/logger';
import { PaymentMethod, PaymentStatus } from '@prisma/client';

export interface PaymentCreateData {
  reservationId: number;
  userId: number;
  amount: number;
  paymentMethod: PaymentMethod;
  status?: PaymentStatus;
}

export interface PaymentUpdateData {
  status?: PaymentStatus;
  transactionId?: string;
}

export interface Payment {
  id: number;
  reservationId: number;
  userId: number;
  amount: number;
  paymentMethod: PaymentMethod;
  status: PaymentStatus;
  transactionId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export class PaymentRepository extends BaseRepository<Payment, PaymentCreateData, PaymentUpdateData> {
  /**
   * Create a new payment
   */
  async create(data: PaymentCreateData): Promise<Payment> {
    return prisma.payment.create({
      data,
    });
  }

  /**
   * Find payment by ID
   */
  async findById(id: number): Promise<Payment | null> {
    return prisma.payment.findUnique({
      where: { id },
    });
  }

  /**
   * Find all payments with optional filtering
   */
  async findAll(filters?: Record<string, unknown>): Promise<Payment[]> {
    return prisma.payment.findMany({
      where: filters || {},
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Find payments by user ID
   */
  async findByUserId(userId: number): Promise<Payment[]> {
    return prisma.payment.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Find payments by reservation ID
   */
  async findByReservationId(reservationId: number): Promise<Payment[]> {
    return prisma.payment.findMany({
      where: { reservationId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Find payment by transaction ID
   */
  async findByTransactionId(transactionId: string): Promise<Payment | null> {
    return prisma.payment.findUnique({
      where: { transactionId },
    });
  }

  /**
   * Update payment
   */
  async update(id: number, data: PaymentUpdateData): Promise<Payment> {
    return prisma.payment.update({
      where: { id },
      data,
    });
  }

  /**
   * Delete payment (should rarely need this)
   */
  async delete(id: number): Promise<boolean> {
    try {
      await prisma.payment.delete({
        where: { id },
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Find pending payments (not yet completed)
   */
  async getPendingPayments(): Promise<Payment[]> {
    return prisma.payment.findMany({
      where: {
        status: PaymentStatus.PENDING,
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  /**
   * Find completed payments for a user
   */
  async getCompletedPaymentsForUser(userId: number): Promise<Payment[]> {
    return prisma.payment.findMany({
      where: {
        userId,
        status: PaymentStatus.COMPLETED,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get payment statistics for a period
   */
  async getPaymentStats(startDate: Date, endDate: Date): Promise<{
    totalCompleted: number;
    totalRevenue: number;
    countCompleted: number;
    countFailed: number;
    countPending: number;
  }> {
    try {
      const payments = await prisma.payment.findMany({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
      });

      const completed = payments.filter((p: Payment): boolean => p.status === PaymentStatus.COMPLETED);
      const failed = payments.filter((p: Payment): boolean => p.status === PaymentStatus.FAILED);
      const pending = payments.filter((p: Payment): boolean => p.status === PaymentStatus.PENDING);

      const totalRevenue = completed.reduce((sum: number, p: Payment): number => sum + p.amount, 0);

      return {
        totalCompleted: Math.round(totalRevenue * 100) / 100,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        countCompleted: completed.length,
        countFailed: failed.length,
        countPending: pending.length,
      };
    } catch (error) {
      Logger.error('Error calculating payment statistics', error as Error);
      throw error;
    }
  }

  /**
   * Get user's total spending
   */
  async getUserTotalSpending(userId: number): Promise<number> {
    try {
      const payments = await prisma.payment.findMany({
        where: {
          userId,
          status: PaymentStatus.COMPLETED,
        },
      });

      const total = payments.reduce((sum: number, p: Payment): number => sum + p.amount, 0);
      return Math.round(total * 100) / 100;
    } catch (error) {
      Logger.error('Error calculating user total spending', error as Error);
      throw error;
    }
  }
}
