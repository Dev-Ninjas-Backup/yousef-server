import { PartialType } from '@nestjs/mapped-types';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { CreateProductDto } from './create-product.dto';

enum ProductStatus {
  DRAFT = 'DRAFT',
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export class UpdateProductDto extends PartialType(CreateProductDto) {
  @ApiPropertyOptional({
    description: 'Product status',
    enum: ProductStatus,
    example: ProductStatus.APPROVED,
  })
  @IsOptional()
  @IsEnum(ProductStatus)
  status?: ProductStatus;
}
