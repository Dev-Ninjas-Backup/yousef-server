import { PaginationDto } from './pagination.dto';
import { PaginatedResult, PaginationMeta } from './pagination.interface';

export class PaginationUtil {
  /**
   * Calculate pagination metadata
   */
  static calculateMeta(
    total: number,
    page: number,
    limit: number,
  ): PaginationMeta {
    const totalPages = Math.ceil(total / limit);

    return {
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    };
  }

  /**
   * Calculate skip value for database queries
   */
  static calculateSkip(page: number, limit: number): number {
    return (page - 1) * limit;
  }

  /**
   * Create paginated response
   */
  static createPaginatedResponse<T>(
    data: T[],
    total: number,
    paginationDto: PaginationDto,
  ): PaginatedResult<T> {
    const { page = 1, limit = 10 } = paginationDto;

    return {
      data,
      meta: this.calculateMeta(total, page, limit),
    };
  }

  /**
   * Get pagination params for Prisma
   */
  static getPrismaParams(paginationDto: PaginationDto) {
    const { page = 1, limit = 10 } = paginationDto;

    return {
      skip: this.calculateSkip(page, limit),
      take: limit,
    };
  }
}
