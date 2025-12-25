import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Transform } from 'class-transformer';
import {
  IsArray,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'Demo User', required: false })
  @IsOptional()
  @IsString()
  fullName?: string;

  @ApiProperty({ example: 'demo@gmail.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: '01234567890' })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiProperty({ example: '12345678', minLength: 6 })
  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @ApiProperty({ example: '12345678' })
  @IsNotEmpty()
  confirmPassword: string;

  @ApiProperty({ example: 'Ai Garage Auto Care', required: false })
  @IsOptional()
  @IsString()
  garageName?: string;

  @ApiProperty({ example: 'Dubai Marina', required: false })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({ example: 'Dubai', required: false })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiProperty({ example: 'Sharjah', required: false })
  @IsOptional()
  @IsString()
  emirate?: string;

  @ApiProperty({
    example: '13353',
    description: 'Enter the user userLat',
    required: false,
  })
  @IsOptional()
  @IsString()
  userLat?: string;

  @ApiProperty({
    example: '53353',
    description: 'Enter the user userLng',
    required: false,
  })
  @IsOptional()
  @IsString()
  userLng?: string;
  // Fixed serviceCategories handling
  @ApiProperty({
    example: '["Oil Change", "Brake Repair"]',
    required: false,
    type: String,
    description: 'Send as JSON string or comma-separated values',
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (!value) return undefined;

    if (Array.isArray(value)) return value;

    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed : undefined;
      } catch {
        return value
          .split(',')
          .map((item: string) => item.trim())
          .filter(Boolean);
      }
    }

    return undefined;
  })
  @IsArray({ message: 'serviceCategories must be an array' })
  serviceCategories?: string[];

  @ApiProperty({
    type: 'string',
    format: 'binary',
    required: false,
    description: 'Garage logo image',
  })
  @IsOptional()
  garageLogo?: Express.Multer.File;

  @ApiProperty({
    type: 'string',
    format: 'binary',
    required: false,
    description: 'Trade license file',
  })
  @IsOptional()
  tradeLicense?: Express.Multer.File;

  @ApiProperty({
    example: 'GARAGE_OWNER',
    required: true,
    enum: UserRole,
  })
  @IsString()
  @IsNotEmpty()
  @IsEnum(UserRole)
  role: UserRole;
}
