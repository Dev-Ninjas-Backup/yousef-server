import {
  ApiHideProperty,
  ApiProperty,
  ApiPropertyOptional,
} from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  ValidateIf,
} from 'class-validator';

export class CreatePromotionalAdDto {
  @ApiHideProperty()
  userId: string;

  @ApiPropertyOptional({
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    description: 'Optional product ID if promoting a specific product',
  })
  @IsOptional()
  @IsUUID()
  productId?: string;

  @ApiProperty({
    example: '20% Off Brake Pad Replacement',
    description: 'Title of the promotional ad',
  })
  @IsString()
  adTitle: string;

  @ApiProperty({
    example: 'Get 20% off on brake pad replacement at SpeedPro Garage! Expert mechanics, genuine parts, same-day service.',
    description: 'Detailed description of the offer',
  })
  @IsString()
  description: string;

  @ApiProperty({
    example: 'GARAGE_SERVICE',
    description: 'Type of ad (e.g., GARAGE_SERVICE, PRODUCT_DISCOUNT)',
    enum: ['GARAGE_SERVICE', 'PRODUCT_DISCOUNT', 'GENERAL_OFFER'],
  })
  @IsString()
  @IsIn(['GARAGE_SERVICE', 'PRODUCT_DISCOUNT', 'GENERAL_OFFER'])
  adType: string;

  @ApiPropertyOptional({
    example: '20',
    description: 'Discount value (percentage or amount). Send as string to avoid floating point issues.',
  })
  @IsOptional()
  @IsString()
  discount?: string;

  @ApiProperty({
    example: 'Dubai Marina',
    description: 'Location where the offer is valid',
  })
  @IsString()
  location: string;

  @ApiProperty({
    example: '2025-11-25T00:00:00.000Z',
    description: 'Promotion start date (ISO format)',
  })
  @IsDateString()
  validFrom: string;

  @ApiProperty({
    example: '2025-12-01T23:59:59.000Z',
    description: 'Promotion end date (ISO format)',
  })
  @IsDateString()
  validUntil: string;

  @ApiPropertyOptional({
    type: [String],
    example: ['https://your-bucket.s3.amazonaws.com/ad1.jpg'],
    description: 'Direct image URLs (if not uploading files)',
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    if (typeof value === 'string')
      return value.split(',').map((url: string) => url.trim()).filter(Boolean);
    return [];
  })
  @IsArray()
  @IsString({ each: true })
  imageUrl?: string[];

  @ApiPropertyOptional({
    type: 'array',
    items: { type: 'string', format: 'binary' },
    description: 'Upload up to 5 images (max 5MB each)',
  })
  @IsOptional()
  images?: any;

  @ApiPropertyOptional({
    example: 'pi_3Oxyz1234567890',
    description:
      'Payment Intent ID from Stripe. Required if free listings are exhausted.',
  })
  @IsOptional()
  @IsString()
  @ValidateIf((o) => o.paymentIntentId !== undefined)
  paymentIntentId?: string;
}