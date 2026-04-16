/**
 * RefreshToken Repository — Data access layer for RefreshToken entity
 * Manages token revocation and expiration checks
 */

import prisma from '../Models';
import { BaseRepository } from './BaseRepository';

export interface RefreshTokenCreateData {
  userId: number;
  token: string;
  expiresAt: Date;
}

export interface RefreshToken {
  id: number;
  userId: number;
  token: string;
  expiresAt: Date;
  revokedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface RefreshTokenUpdateData {
  userId?: number;
  token?: string;
  expiresAt?: Date;
  revokedAt?: Date | null;
}

export class RefreshTokenRepository extends BaseRepository<RefreshToken, RefreshTokenCreateData, RefreshTokenUpdateData> {
  /**
   * Create a new refresh token
   */
  async create(data: RefreshTokenCreateData): Promise<RefreshToken> {
    return prisma.refreshToken.create({
      data,
    });
  }

  /**
   * Find token by ID
   */
  async findById(id: number): Promise<RefreshToken | null> {
    return prisma.refreshToken.findUnique({
      where: { id },
    });
  }

  /**
   * Find token by token string
   */
  async findByToken(token: string): Promise<RefreshToken | null> {
    return prisma.refreshToken.findUnique({
      where: { token },
    });
  }

  /**
   * Find all refresh tokens (implements BaseRepository abstract method)
   */
  async findAll(filters?: Record<string, unknown>): Promise<RefreshToken[]> {
    return prisma.refreshToken.findMany({
      where: filters || {},
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Find all tokens for a user
   */
  async findByUserId(userId: number): Promise<RefreshToken[]> {
    return prisma.refreshToken.findMany({
      where: { userId },
    });
  }

  /**
   * Find all non-revoked, non-expired tokens for a user
   */
  async findValidByUserId(userId: number): Promise<RefreshToken[]> {
    const now = new Date();
    return prisma.refreshToken.findMany({
      where: {
        userId,
        revokedAt: null,
        expiresAt: {
          gt: now,
        },
      },
    });
  }

  /**
   * Update token
   */
  async update(id: number, data: RefreshTokenUpdateData): Promise<RefreshToken> {
    return prisma.refreshToken.update({
      where: { id },
      data,
    });
  }

  /**
   * Delete token by ID
   */
  async delete(id: number): Promise<boolean> {
    await prisma.refreshToken.delete({
      where: { id },
    });
    return true;
  }

  /**
   * Delete all tokens for a user (revoke all sessions)
   */
  async deleteByUserId(userId: number): Promise<number> {
    const result = await prisma.refreshToken.deleteMany({
      where: { userId },
    });
    return result.count;
  }

  /**
   * Revoke a token by setting revokedAt timestamp
   */
  async revoke(id: number): Promise<RefreshToken> {
    return prisma.refreshToken.update({
      where: { id },
      data: {
        revokedAt: new Date(),
      },
    });
  }

  /**
   * Find all expired tokens
   */
  async findExpired(): Promise<RefreshToken[]> {
    return prisma.refreshToken.findMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });
  }
}
