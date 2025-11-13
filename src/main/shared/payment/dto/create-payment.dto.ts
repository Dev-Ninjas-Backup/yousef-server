import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsInt } from 'class-validator';

export class CreatePaymentDto {
  @ApiProperty({
    description: 'Stripe session ID',
    example: 'string',
  })
  @IsString()
  sessionId: string;

  @ApiProperty({
    description: 'Stripe transaction ID',
    example: 'string',
  })
  @IsOptional()
  @IsString()
  transactionId?: string;

  @ApiProperty({
    description: 'Payment amount in smallest currency unit (e.g., cents)',
    example: 4999,
  })
  @IsOptional()
  @IsInt()
  amount?: number;

  @ApiProperty({ description: 'Currency code (ISO 4217)', example: 'USD' })
  @IsString()
  currency: string;

  @ApiProperty({ description: 'Payment status', example: 'succeeded' })
  @IsString()
  status: string;

  @ApiProperty({ description: 'Payment method type', example: 'card' })
  @IsOptional()
  @IsString()
  paymentMethod?: string;

  @ApiProperty({
    description: ' ID of the associated payment plan',
    example: 'a61c9422-4067-41ec-a77b-8135626307c8',
  })
  @IsString()
  planId: string;
}
