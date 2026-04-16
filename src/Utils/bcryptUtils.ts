import bcrypt from 'bcrypt';

/**
 * Password Hashing Utilities
 * Per backend-rules.md: User passwords must be hashed with bcrypt before storing
 */

const SALT_ROUNDS = 10;

/**
 * Hash a plain text password
 */
export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, SALT_ROUNDS);
};

/**
 * Compare a plain text password with a hashed password
 */
export const comparePasswords = async (
  password: string,
  hashedPassword: string
): Promise<boolean> => {
  return bcrypt.compare(password, hashedPassword);
};

/**
 * Check if a string is already hashed (starts with $2a, $2b, or $2y)
 */
export const isHashed = (str: string): boolean => {
  return /^\$2[aby]\$\d+\$/.test(str);
};
