/**
 * User Repository — Data access layer for User entity
 * Abstracts Prisma operations from Service layer
 * Per backend-rules.md: Veri tabanı bağlantıları her zaman asenkron (async/await) olmalı
 */

import prisma from '../Models';
import { BaseRepository } from './BaseRepository';
import { UserRole } from '@prisma/client';

export interface UserCreateData {
  email: string;
  gsm: string;
  password: string;
  name?: string;
  role?: UserRole;
}

export interface UserUpdateData {
  email?: string;
  gsm?: string;
  password?: string;
  name?: string;
  role?: UserRole;
  isVerified?: boolean;
  otpCode?: string | null;
  otpExpiresAt?: Date | null;
}

export interface User {
  id: number;
  email: string;
  gsm: string;
  password: string;
  name: string | null;
  role: UserRole;
  isVerified: boolean;
  otpCode: string | null;
  otpExpiresAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export class UserRepository extends BaseRepository<User, UserCreateData, UserUpdateData> {
  /**
   * Create a new user
   */
  async create(data: UserCreateData): Promise<User> {
    return prisma.user.create({
      data,
    });
  }

  /**
   * Find user by ID
   */
  async findById(id: number): Promise<User | null> {
    return prisma.user.findUnique({
      where: { id },
    });
  }

  /**
   * Find user by email (commonly used in auth)
   */
  async findByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { email },
    });
  }

  /**
   * Find all users with optional filtering
   */
  async findAll(filters?: Record<string, unknown>): Promise<User[]> {
    return prisma.user.findMany({
      where: filters || {},
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Update user
   */
  async update(id: number, data: UserUpdateData): Promise<User> {
    return prisma.user.update({
      where: { id },
      data,
    });
  }

  /**
   * Delete user
   */
  async delete(id: number): Promise<boolean> {
    await prisma.user.delete({
      where: { id },
    });
    return true;
  }

  /**
   * Check if email exists
   */
  async emailExists(email: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
    return !!user;
  }
}
