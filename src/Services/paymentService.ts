/**
 * Payment Service
 * Per backend-rules.md: Business logic resides ONLY in Services layer
 * Handles payment processing and tracking
 */

import { PaymentRepository } from '../Repositories/PaymentRepository';
import { ReservationRepository } from '../Repositories/ReservationRepository';
import { AppError } from '../Utils/AppError';
import { Logger } from '../Utils/logger';
import { PaycellService } from './paycellService';

const paycellService = new PaycellService();

export interface PaymentResponse {
  id: number;
  reservationId: number;
  userId: number;
  amount: number;
  paymentMethod: string;
  status: string;
  transactionId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaymentStatistics {
  totalCompleted: number;
  totalRevenue: number;
  countCompleted: number;
  countFailed: number;
  countPending: number;
}

export interface CardPaymentRequest {
  paymentId: number;
  cardNumber: string;
  cardholderName: string;
  expiryDate: string;
  cvv: string;
  amount: number;
}

export interface PaymentSimulationResult {
  status: 'SUCCESS' | 'FAILED';
  transactionId: string;
  message: string;
}

export class PaymentService {
  private paymentRepository: PaymentRepository;
  private reservationRepository: ReservationRepository;

  constructor() {
    this.paymentRepository = new PaymentRepository();
    this.reservationRepository = new ReservationRepository();
  }

  /**
   * Process payment via Paycell Mobil Ödeme (Direct Carrier Billing)
   */
  async processPaycellPayment(
    paymentId: number,
    msisdn: string
  ): Promise<PaymentResponse> {
    try {
      const payment = await this.paymentRepository.findById(paymentId);
      if (!payment) throw new AppError('Ödeme kaydı bulunamadı.', 404);
      if (payment.status !== 'PENDING') throw new AppError('Ödeme zaten işlenmiş.', 400);

      const paycellResult = await paycellService.processPayment({
        msisdn,
        amount: payment.amount,
        orderId: `ORD-${payment.id}`,
        description: 'ParkET Otopark Rezervasyonu'
      });

      const updatedPayment = await this.paymentRepository.update(paymentId, {
        status: paycellResult.status === 'SUCCESS' ? 'COMPLETED' : 'FAILED',
        transactionId: paycellResult.transactionId,
        paymentMethod: 'PAYCELL'
      });

      if (paycellResult.status === 'FAILED') {
        throw new AppError(`Paycell Ödeme Hatası: ${paycellResult.resultDescription}`, 402);
      }

      return this.mapToResponse(updatedPayment);
    } catch (error) {
      if (error instanceof AppError) throw error;
      Logger.error('Error in Paycell payment flow', error as Error);
      throw new AppError('Paycell işlemi sırasında bir hata oluştu.', 500);
    }
  }

  /**
   * Process payment completion
   * In real scenario, this would integrate with payment gateway (Stripe, PayPal, etc.)
   * For now, it's a placeholder for payment processing logic
   * 
   * @param paymentId Payment ID to process
   * @param transactionId Transaction ID from payment provider
   * @returns Updated payment details
   */
  async processPayment(
    paymentId: number,
    transactionId?: string
  ): Promise<PaymentResponse> {
    try {
      Logger.debug('Processing payment', { paymentId, transactionId });

      const payment = await this.paymentRepository.findById(paymentId);

      if (!payment) {
        throw new AppError('Ödeme kaydı bulunamadı.', 404);
      }

      if (payment.status !== 'PENDING') {
        throw new AppError(
          `Bu ödemenin durumu '${payment.status}'. Beklemede olan ödemeler işlenebilir.`,
          400
        );
      }

      // Update payment status to COMPLETED
      const updatedPayment = await this.paymentRepository.update(paymentId, {
        status: 'COMPLETED',
        transactionId: transactionId || `TXN-${paymentId}-${Date.now()}`,
      });

      Logger.info('Payment processed successfully', {
        paymentId,
        amount: payment.amount,
        transactionId: updatedPayment.transactionId,
      });

      return this.mapToResponse(updatedPayment);
    } catch (error) {
      if (error instanceof AppError) throw error;
      Logger.error('Error processing payment', error as Error);
      throw new AppError('Ödeme işlenmesi sırasında hata oluştu.', 500);
    }
  }

  /**
   * Process payment with card simulator
   * Simulates payment gateway responses based on card number
   * 
   * Mock card numbers:
   * - 4242-4242-4242-4242: Returns SUCCESS
   * - 4000-0000-0000-0002: Returns FAILED
   * - Any other card: Returns FAILED
   * 
   * @param request Card payment request with card details
   * @returns Payment response with simulation result
   */
  async processPaymentWithCardSimulator(
    request: CardPaymentRequest
  ): Promise<PaymentResponse> {
    try {
      Logger.debug('Processing payment with card simulator', {
        paymentId: request.paymentId,
        cardNumber: this.maskCardNumber(request.cardNumber),
        amount: request.amount,
      });

      // Validate payment exists and has correct status
      const payment = await this.paymentRepository.findById(request.paymentId);

      if (!payment) {
        throw new AppError('Ödeme kaydı bulunamadı.', 404);
      }

      if (payment.status !== 'PENDING') {
        throw new AppError(
          `Bu ödemenin durumu '${payment.status}'. Beklemede olan ödemeler işlenebilir.`,
          400
        );
      }

      // Validate payment amount matches
      if (payment.amount !== request.amount) {
        throw new AppError('Ödeme tutarı uyuşmuyor.', 400);
      }

      // Simulate payment processing
      const simulationResult = this.simulateCardPayment(request.cardNumber);

      // Update payment status based on simulation result
      const updatedPayment = await this.paymentRepository.update(
        request.paymentId,
        {
          status: simulationResult.status === 'SUCCESS' ? 'COMPLETED' : 'FAILED',
          transactionId:
            simulationResult.transactionId ||
            `TXN-${request.paymentId}-${Date.now()}`,
        }
      );

      // Log payment result
      if (simulationResult.status === 'SUCCESS') {
        Logger.info('Payment processed successfully via simulator', {
          paymentId: request.paymentId,
          amount: payment.amount,
          transactionId: updatedPayment.transactionId,
          cardNumber: this.maskCardNumber(request.cardNumber),
        });
      } else {
        Logger.warn('Payment failed via simulator', {
          paymentId: request.paymentId,
          amount: payment.amount,
          cardNumber: this.maskCardNumber(request.cardNumber),
          reason: simulationResult.message,
        });
      }

      return this.mapToResponse(updatedPayment);
    } catch (error) {
      if (error instanceof AppError) throw error;
      Logger.error('Error processing payment with card simulator', error as Error);
      throw new AppError('Ödeme işlenmesi sırasında hata oluştu.', 500);
    }
  }

  /**
   * Card payment simulator logic
   * Determines payment success/failure based on card number
   * 
   * @param cardNumber Card number in format: XXXX-XXXX-XXXX-XXXX
   * @returns Simulation result with status and transaction ID
   */
  private simulateCardPayment(cardNumber: string): PaymentSimulationResult {
    // Normalize card number (remove spaces and dashes)
    const normalizedCardNumber = cardNumber.replace(/[\s-]/g, '');

    // Success card: 4242-4242-4242-4242
    if (normalizedCardNumber === '4242424242424242') {
      return {
        status: 'SUCCESS',
        transactionId: `TXN-${Date.now()}-SUCCESS`,
        message: 'Ödeme başarıyla işlendi.',
      };
    }

    // Failed card: 4000-0000-0000-0002
    if (normalizedCardNumber === '4000000000000002') {
      return {
        status: 'FAILED',
        transactionId: `TXN-${Date.now()}-DECLINED`,
        message: 'Kart reddedildi. Lütfen başka bir kart deneyin.',
      };
    }

    // Default: All other cards fail
    return {
      status: 'FAILED',
      transactionId: `TXN-${Date.now()}-FAILED`,
      message: 'Ödeme işlemi başarısız oldu. Lütfen detayları kontrol edin.',
    };
  }

  /**
   * Mask sensitive card number for logging
   * Shows only last 4 digits
   * 
   * @param cardNumber Card number to mask
   * @returns Masked card number
   */
  private maskCardNumber(cardNumber: string): string {
    const cleaned = cardNumber.replace(/[\s-]/g, '');
    if (cleaned.length < 4) {
      return '****';
    }
    return `****-****-****-${cleaned.slice(-4)}`;
  }

  /**
   * Handle failed payment
   */
  async markPaymentFailed(paymentId: number, reason?: string): Promise<PaymentResponse> {
    try {
      Logger.debug('Marking payment as failed', { paymentId, reason });

      const payment = await this.paymentRepository.findById(paymentId);

      if (!payment) {
        throw new AppError('Ödeme kaydı bulunamadı.', 404);
      }

      const updatedPayment = await this.paymentRepository.update(paymentId, {
        status: 'FAILED',
      });

      Logger.warn('Payment marked as failed', {
        paymentId,
        amount: payment.amount,
        reason,
      });

      return this.mapToResponse(updatedPayment);
    } catch (error) {
      if (error instanceof AppError) throw error;
      Logger.error('Error marking payment as failed', error as Error);
      throw new AppError('Ödeme işaretlenmesi sırasında hata oluştu.', 500);
    }
  }

  /**
   * Get payment details
   */
  async getPayment(paymentId: number): Promise<PaymentResponse | null> {
    try {
      const payment = await this.paymentRepository.findById(paymentId);
      return payment ? this.mapToResponse(payment) : null;
    } catch (error) {
      Logger.error('Error fetching payment', error as Error);
      throw error;
    }
  }

  /**
   * Get user's payment history
   */
  async getUserPayments(userId: number): Promise<PaymentResponse[]> {
    try {
      const payments = await this.paymentRepository.findByUserId(userId);
      return payments.map((p) => this.mapToResponse(p));
    } catch (error) {
      Logger.error('Error fetching user payments', error as Error);
      throw error;
    }
  }

  /**
   * Get reservation's related payments
   */
  async getReservationPayments(
    reservationId: number
  ): Promise<PaymentResponse[]> {
    try {
      const payments = await this.paymentRepository.findByReservationId(
        reservationId
      );
      return payments.map((p) => this.mapToResponse(p));
    } catch (error) {
      Logger.error('Error fetching reservation payments', error as Error);
      throw error;
    }
  }

  /**
   * Get payment statistics for a time period
   */
  async getPaymentStatistics(
    startDate: Date,
    endDate: Date
  ): Promise<PaymentStatistics> {
    try {
      Logger.debug('Calculating payment statistics', {
        startDate,
        endDate,
      });

      const stats = await this.paymentRepository.getPaymentStats(
        startDate,
        endDate
      );

      Logger.info('Payment statistics calculated', stats);

      return stats;
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
      const total = await this.paymentRepository.getUserTotalSpending(userId);
      return total;
    } catch (error) {
      Logger.error('Error calculating user total spending', error as Error);
      throw error;
    }
  }

  /**
   * Get pending payments that need processing
   */
  async getPendingPayments(): Promise<PaymentResponse[]> {
    try {
      const payments = await this.paymentRepository.getPendingPayments();
      return payments.map((p) => this.mapToResponse(p));
    } catch (error) {
      Logger.error('Error fetching pending payments', error as Error);
      throw error;
    }
  }

  /**
   * Process refund for a payment
   */
  async processRefund(paymentId: number): Promise<PaymentResponse> {
    try {
      Logger.debug('Processing refund', { paymentId });

      const payment = await this.paymentRepository.findById(paymentId);

      if (!payment) {
        throw new AppError('Ödeme kaydı bulunamadı.', 404);
      }

      if (payment.status !== 'COMPLETED') {
        throw new AppError(
          'Sadece tamamlanan ödemeler için geri ödeme işlemi yapılabilir.',
          400
        );
      }

      const refundedPayment = await this.paymentRepository.update(paymentId, {
        status: 'REFUNDED',
      });

      Logger.info('Refund processed', {
        paymentId,
        amount: payment.amount,
      });

      return this.mapToResponse(refundedPayment);
    } catch (error) {
      if (error instanceof AppError) throw error;
      Logger.error('Error processing refund', error as Error);
      throw new AppError('Geri ödeme işleminde hata oluştu.', 500);
    }
  }

  /**
   * Map payment entity to response DTO
   */
  private mapToResponse(payment: any): PaymentResponse {
    return {
      id: payment.id,
      reservationId: payment.reservationId,
      userId: payment.userId,
      amount: payment.amount,
      paymentMethod: payment.paymentMethod,
      status: payment.status,
      transactionId: payment.transactionId,
      createdAt: payment.createdAt,
      updatedAt: payment.updatedAt,
    };
  }
}
