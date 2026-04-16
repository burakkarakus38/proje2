import { Logger } from '../Utils/logger';
import { AppError } from '../Utils/AppError';

export interface PaycellPaymentRequest {
  msisdn: string;
  amount: number;
  orderId: string;
  description: string;
}

export interface PaycellResponse {
  resultCode: string;
  resultDescription: string;
  transactionId: string;
  status: 'SUCCESS' | 'FAILED';
}

/**
 * Paycell Service Simulator
 * This service mimics the Paycell Mobile Payment and Direct Carrier Billing API.
 * In a real scenario, this would communicate with Turkcell Paycell endpoints.
 */
export class PaycellService {
  /**
   * Initialize Paycell payment
   */
  async processPayment(request: PaycellPaymentRequest): Promise<PaycellResponse> {
    try {
      Logger.info('Paycell payment request received', {
        msisdnHash: this.maskMsisdn(request.msisdn),
        orderId: request.orderId,
        amount: request.amount
      });

      // Simulate network latency
      await new Promise(resolve => setTimeout(resolve, 800));

      // Business logic simulation:
      // 1. If amount > 1000, reject (insufficient limit typical mock)
      // 2. If msisdn ends in '00', fail (generic error)
      
      const isLimitExceeded = request.amount > 1000;
      const isNumberBlocked = request.msisdn.endsWith('00');

      if (isLimitExceeded) {
        return {
          resultCode: 'LIMIT_EXCEEDED',
          resultDescription: 'Paycell mobil ödeme limitiniz yetersiz.',
          transactionId: '',
          status: 'FAILED'
        };
      }

      if (isNumberBlocked) {
        return {
          resultCode: 'BLOCKED_USER',
          resultDescription: 'Hattınız Paycell mobil ödemeye kapalıdır.',
          transactionId: '',
          status: 'FAILED'
        };
      }

      // Success case
      const transactionId = `PCLL-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      
      Logger.info('Paycell payment SUCCESS', { transactionId, orderId: request.orderId });

      return {
        resultCode: '0000',
        resultDescription: 'İşlem Başarılı',
        transactionId,
        status: 'SUCCESS'
      };

    } catch (error) {
      Logger.error('Paycell API communication error', error as Error);
      throw new AppError('Paycell servis hatası oluştu.', 502);
    }
  }

  private maskMsisdn(msisdn: string): string {
    return msisdn.substring(0, 3) + '***' + msisdn.substring(msisdn.length - 2);
  }
}
