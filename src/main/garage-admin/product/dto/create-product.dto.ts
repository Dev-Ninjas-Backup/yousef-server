import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

class SellerDto {
  @ApiProperty({ description: 'Name of the seller', example: 'John Doe' })
  @IsString()
  @IsNotEmpty() // Added validation for required fields based on UI
  name: string;

  @ApiProperty({
    description: 'Email of the seller',
    example: 'john@example.com',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiPropertyOptional({
    description: 'Phone number of the seller',
    example: '+971 XXX XXX XXX',
  })
  @IsOptional()
  @IsString()
  phoneNumber?: string;

  // FIX: Added sellerType field to capture the radio button selection from the UI
  @ApiProperty({
    description: 'Seller type (e.g., Individual Seller, Verified Supplier)',
    example: 'Individual Seller',
  })
  @IsString()
  @IsNotEmpty()
  sellerType: string;

  @ApiPropertyOptional({ description: 'Is seller verified', example: true })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  isVerified?: boolean;
}

export class CreateProductDto {
  @ApiProperty({
    description: 'Name of the product (Part Name)',
    example: 'Brake Pads Front Set',
  })
  @IsString()
  @IsNotEmpty() // Assuming partName is required
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

  // REMOVED: status field as it is system-set ('Pending Approval' in service)

  @ApiPropertyOptional({
    description: 'Is product promoted (UI checkbox)',
    example: true,
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  isPromoted?: boolean;

  @ApiPropertyOptional({
    description: 'Promotion cost in AED (-20 AED fee from UI)',
    example: 20.0,
  })
  @IsOptional()
  @Transform(({ value }) => (value ? parseFloat(value) : undefined))
  @IsNumber()
  @Min(0)
  promoCost?: number; // Matches Decimal in Prisma

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
    example: '+971 XXX XXX XXX',
  })
  @IsOptional()
  @IsString()
  sellerPhoneNumber?: string;

  @ApiProperty({ description: 'Seller type', example: 'Individual Seller' })
  @IsString()
  @IsNotEmpty()
  sellerType: string;

  @ApiPropertyOptional({ description: 'Is seller verified', example: true })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  sellerIsVerified?: boolean;

  @ApiPropertyOptional({
    type: 'array',
    items: { type: 'string', format: 'binary' },
    description: 'Product photos (max 5 files - UI limit)', // FIX: UI limit is 5
  })
  @IsOptional()
  photos?: Express.Multer.File[];
}
