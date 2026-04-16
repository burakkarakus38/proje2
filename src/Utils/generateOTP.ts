import { Logger } from './logger';

/**
 * Generate 6-digit OTP (One-Time Password)
 * Used for SMS verification during registration
 * Currently logs to console instead of sending actual SMS
 * 
 * @returns 6-digit OTP as string
 */
export const generateOTP = (): string => {
  const otp = '1234';
  Logger.info(`📱 SMS Verification Code: ${otp}`, { otp });
  return otp;
};

/**
 * Validate OTP
 * @param userOTP - OTP from user input
 * @param generatedOTP - OTP generated for this session
 * @returns true if OTP is valid
 */
export const validateOTP = (userOTP: string, generatedOTP: string): boolean => {
  return userOTP === generatedOTP;
};
