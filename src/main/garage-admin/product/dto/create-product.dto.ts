import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

enum SellerType {
  INDIVIDUAL = 'INDIVIDUAL',
  VERIFIED_SUPPLIER = 'VERIFIED_SUPPLIER',
}

// enum ProductStatus {
//   DRAFT = 'DRAFT',
//   PENDING = 'PENDING',
//   APPROVED = 'APPROVED',
//   REJECTED = 'REJECTED',
// }

enum PlanType {
  MONTHLY = 'MONTHLY',
  PAY_PER = 'PAY_PER',
}

export class CreateProductDto {
  @ApiProperty({
    description: 'Name of the product (Part Name)',
    example: 'Brake Pads Front Set',
  })
  @IsString()
  @IsNotEmpty()
  partName: string;

  @ApiPropertyOptional({
    description: 'Brand of the product',
    example: 'Bosch',
  })
  @IsOptional()
  @IsString()
  brand?: string;

  @ApiProperty({
    description: 'Unique identifier of the parts category',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsString()
  @IsNotEmpty()
  categoryId: string;

  @ApiProperty({ description: 'Condition of the product', example: 'New' })
  @IsString()
  @IsNotEmpty()
  condition: string;

  @ApiProperty({ description: 'Price in AED', example: 450.0 })
  @Transform(({ value }) => parseFloat(value))
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty({ description: 'Available quantity', example: 15 })
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  @Min(1)
  quantity: number;

  @ApiPropertyOptional({
    description: 'Product description',
    example: 'High-quality brake pads',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Is product promoted',
    example: true,
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  isPromoted?: boolean;

  @ApiPropertyOptional({ description: 'Seller name', example: 'John Doe' })
  @IsOptional()
  @IsString()
  sellerName?: string;

  @ApiPropertyOptional({
    description: 'Seller email',
    example: 'john@example.com',
  })
  @IsOptional()
  @IsEmail()
  sellerEmail?: string;

  @ApiPropertyOptional({
    description: 'Seller phone number',
    example: '+971501234567',
  })
  @IsOptional()
  @IsString()
  sellerPhoneNumber?: string;

  @ApiProperty({
    description: 'Seller type',
    enum: SellerType,
    example: SellerType.INDIVIDUAL,
  })
  @IsEnum(SellerType)
  sellerType: SellerType;

  @ApiProperty({
    description: 'Payment plan type',
    enum: PlanType,
    example: PlanType.PAY_PER,
  })
  @IsEnum(PlanType)
  plan: PlanType;

  @ApiPropertyOptional({
    description: 'Specific plan card under which this product is listed',
    example: 'FREE',
  })
  @IsOptional()
  @IsString()
  listingPlan?: string;

  @ApiPropertyOptional({
    description: 'Promotion duration in days (3 or 7)',
    example: '7',
  })
  @IsOptional()
  @IsString()
  promotedDuration?: string;

  @ApiPropertyOptional({
    type: 'array',
    items: { type: 'string', format: 'binary' },
    description: 'Product photos (max 5 files)',
  })
  photos?: any;

  @ApiPropertyOptional({
    type: 'string',
    format: 'binary',
    description:
      'Verification image (required when sellerType is VERIFIED_SUPPLIER)',
  })
  verificationImage?: any;
}
