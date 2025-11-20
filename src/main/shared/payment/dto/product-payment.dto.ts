import { IsNotEmpty, IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ProductPaymentDto {
  @ApiProperty({ example: 'clx123abc456def789' })
  @IsNotEmpty()
  @IsString()
  productId: string;

  @ApiProperty({ example: 'Promote my product listing' })
  @IsOptional()
  @IsString()
  description?: string;
}