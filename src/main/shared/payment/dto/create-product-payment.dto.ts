import { IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateProductPaymentDto {
  @ApiProperty({ example: 'Premium Product Package' })
  @IsNotEmpty()
  @IsString()
  productName: string;

  @ApiProperty({ example: 29.99 })
  @IsNotEmpty()
  @IsNumber()
  @Min(0.5) // Minimum $0.50
  amount: number;

  @ApiProperty({ example: 'Access to premium features and unlimited products' })
  @IsString()
  description?: string;
}