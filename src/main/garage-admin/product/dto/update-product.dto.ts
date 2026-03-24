import { ApiPropertyOptional } from '@nestjs/swagger';
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

export class UpdateProductDto {
  @ApiPropertyOptional({
    description: 'Name of the product (Part Name)',
    example: 'Brake Pads Front Set',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  partName?: string;

  @ApiPropertyOptional({
    description: 'Brand of the product',
    example: 'Bosch',
  })
  @IsOptional()
  @IsString()
  brand?: string;

  @ApiPropertyOptional({
    description: 'Condition of the product',
    example: 'New',
  })
  @IsOptional()
  @IsString()
  condition?: string;

  @ApiPropertyOptional({ description: 'Price in AED', example: 450.0 })
  @IsOptional()
  @Transform(({ value }) => (value ? parseFloat(value) : undefined))
  @IsNumber()
  @Min(0)
  price?: number;

  @ApiPropertyOptional({ description: 'Available quantity', example: 15 })
  @IsOptional()
  @Transform(({ value }) => (value ? parseInt(value) : undefined))
  @IsInt()
  @Min(1)
  quantity?: number;

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

  @ApiPropertyOptional({
    description: 'Seller type',
    enum: SellerType,
    example: SellerType.INDIVIDUAL,
  })
  @IsOptional()
  @IsEnum(SellerType)
  sellerType?: SellerType;

  @ApiPropertyOptional({
    type: 'array',
    items: { type: 'string', format: 'binary' },
    description: 'Product photos (max 5 files)',
  })
  photos?: any;

  @ApiPropertyOptional({
    type: 'string',
    format: 'binary',
    description: 'Verification image',
  })
  verificationImage?: any;
}
