import { ApiProperty } from '@nestjs/swagger';
import { ProductStatus } from '@prisma/client';
import { IsEnum } from 'class-validator';

export class UpdateSparepartsDto {
  @ApiProperty({
    description: 'Status of the spareparts DRAFT, PENDING, APPROVED, REJECTED ',
    enum: ProductStatus,
    example: ProductStatus.APPROVED,
  })
  @IsEnum(ProductStatus)
  status: ProductStatus;
}
