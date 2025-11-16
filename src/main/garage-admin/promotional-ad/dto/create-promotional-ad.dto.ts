import { IsString, IsOptional, IsDateString, IsDecimal, IsArray, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional, ApiHideProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class CreatePromotionalAdDto {
  @ApiHideProperty()
  userId: string;

  @ApiPropertyOptional({ example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479', description: 'Product ID if promoting specific product' })
  @IsOptional()
  @IsString()
  @IsUUID()
  productId?: string;

  @ApiProperty({ example: 'Special Discount on BMW Parts', description: 'Title of the promotional ad' })
  @IsString()
  adTitle: string;

  @ApiProperty({ example: 'Get 25% off on all BMW spare parts this weekend only!', description: 'Detailed description of the offer' })
  @IsString()
  description: string;

  @ApiProperty({ example: 'DISCOUNT', description: 'Type of advertisement' })
  @IsString()
  adType: string;

  @ApiPropertyOptional({ example: '25.50', description: 'Discount percentage or amount' })
  @IsOptional()
  @IsString()
  discount?: string;

  @ApiProperty({ example: 'Dubai, UAE', description: 'Location where offer is valid' })
  @IsString()
  location: string;

  @ApiProperty({ example: '2024-01-15T00:00:00Z', description: 'Start date of the promotion' })
  @IsDateString()
  validFrom: string;

  @ApiProperty({ example: '2024-01-22T23:59:59Z', description: 'End date of the promotion' })
  @IsDateString()
  validUntil: string;

  @ApiPropertyOptional({ 
    type: [String],
    example: ['https://example.com/image1.jpg', 'https://example.com/image2.jpg'],
    description: 'Direct image URLs'
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') return value.split(',').map(url => url.trim()).filter(url => url);
    return [];
  })
  @IsArray()
  @IsString({ each: true })
  imageUrl?: string[];

  @ApiPropertyOptional({ 
    type: 'string', 
    format: 'binary',
    description: 'Upload image files'
  })
  images?: any;
}