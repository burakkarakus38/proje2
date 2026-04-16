/**
 * Base Repository — Generic data access layer
 * Per backend-rules.md: Services should not directly use Prisma
 * All database operations go through Repository layer for abstraction
 */

export interface IRepository<T, C = Record<string, unknown>, U = Record<string, unknown>> {
  create(data: C): Promise<T>;
  findById(id: number): Promise<T | null>;
  findAll(filters?: Record<string, unknown>): Promise<T[]>;
  update(id: number, data: U): Promise<T>;
  delete(id: number): Promise<boolean>;
}

export abstract class BaseRepository<T, C = Record<string, unknown>, U = Record<string, unknown>> implements IRepository<T, C, U> {
  abstract create(data: C): Promise<T>;
  abstract findById(id: number): Promise<T | null>;
  abstract findAll(filters?: Record<string, unknown>): Promise<T[]>;
  abstract update(id: number, data: U): Promise<T>;
  abstract delete(id: number): Promise<boolean>;
}
