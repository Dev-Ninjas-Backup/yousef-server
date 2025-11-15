import { ApiProperty } from '@nestjs/swagger';
import { ServiceCategory } from '@prisma/client';
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
  // ──────────────────── BASIC INFO ────────────────────
  @ApiProperty({
    example: 'Md Joy',
    required: false,
  })
  @IsOptional()
  @IsString()
  fullName?: string;

  @ApiProperty({
    example: '68urgent@powerscrews.com',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    example: '01700000000',
  })
  @IsString()
  @IsNotEmpty()
  phone: string;

  // ──────────────────── PASSWORD ────────────────────
  @ApiProperty({
    example: '12345678',
    minLength: 6,
  })
  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @ApiProperty({
    example: '12345678',
  })
  @IsNotEmpty()
  confirmPassword: string;

  // ──────────────────── OPTIONAL GARAGE FIELDS ────────────────────
  @ApiProperty({
    example: 'Joy Auto Care',
    required: false,
  })
  @IsOptional()
  @IsString()
  garageName?: string;

  @ApiProperty({
    example: 'Dubai Marina',
    required: false,
  })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({
    example: 'Dubai',
    required: false,
  })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiProperty({
    example: 'Sharjah',
    required: false,
  })
  @IsOptional()
  @IsString()
  emirate?: string;

  // ──────────────────── OPTIONAL SERVICE CATEGORIES ────────────────────
  @ApiProperty({
    example: ['MECHANICAL_REPAIR', 'DIAGNOSTICS'],
    enum: ServiceCategory,
    isArray: true,
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (!value) return [];
    if (typeof value === 'string') {
      return value
        .split(',')
        .map((v) => v.trim())
        .filter(Boolean);
    }
    return Array.isArray(value) ? value.map(String) : [];
  })
  @IsArray()
  @IsEnum(ServiceCategory, { each: true })
  serviceCategories?: ServiceCategory[];

  // ──────────────────── OPTIONAL FILE UPLOADS ────────────────────
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
}
