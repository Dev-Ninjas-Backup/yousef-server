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

enum ProductStatus {
  DRAFT = 'DRAFT',
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
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

  @ApiProperty({ description: 'Category of the product', example: 'Brakes' })
  @IsString()
  @IsNotEmpty()
  category: string;

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

  @ApiPropertyOptional({
    description: 'Promotion cost in AED',
    example: 20.0,
  })
  @IsOptional()
  @Transform(({ value }) => (value ? parseFloat(value) : undefined))
  @IsNumber()
  @Min(0)
  promoCost?: number;

  @ApiProperty({ description: 'Seller name', example: 'John Doe' })
  @IsString()
  @IsNotEmpty()
  sellerName: string;

  @ApiProperty({ description: 'Seller email', example: 'john@example.com' })
  @IsEmail()
  @IsNotEmpty()
  sellerEmail: string;

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

  @ApiPropertyOptional({ description: 'Is seller verified', example: false })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  sellerIsVerified?: boolean;

  @ApiPropertyOptional({
    type: 'array',
    items: { type: 'string', format: 'binary' },
    description: 'Product photos (max 5 files)',
  })
  @IsOptional()
  photos?: Express.Multer.File[];
}
