import { ApiPropertyOptional } from '@nestjs/swagger';
import { ProductStatus } from '@prisma/client';
import { Transform, Type } from 'class-transformer';
import {
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class ProductFilterDto {
  @ApiPropertyOptional({
    description: 'Page number (default: 1)',
    example: 1,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Items per page (default: 20, max: 100)',
    example: 20,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({
    description: 'Search in product name, description, or brand',
    example: 'Brake Pads Front Set',
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim())
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter by category name',
    example: 'Engine Parts',
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim())
  category?: string;

  @ApiPropertyOptional({
    description: 'Filter by product condition',
    example: 'New',
    enum: ['New', 'Used', 'Refurbished'],
  })
  @IsOptional()
  @IsString()
  @IsIn(['New', 'Used', 'Refurbished'], {
    message: 'Condition must be one of: New, Used, Refurbished',
  })
  condition?: string;

  @ApiPropertyOptional({
    description: 'Filter by product status',
    example: 'APPROVED',
    enum: ProductStatus,
  })
  @IsOptional()
  @IsEnum(ProductStatus, {
    message: 'Status must be one of: DRAFT, PENDING, APPROVED, REJECTED',
  })
  status?: ProductStatus;
}
