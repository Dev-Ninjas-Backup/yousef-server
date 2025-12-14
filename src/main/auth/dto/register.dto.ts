import { ApiProperty } from '@nestjs/swagger';
import { ServiceCategory, UserRole } from '@prisma/client';
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
    example: 'Demo User',
    required: false,
  })
  @IsOptional()
  @IsString()
  fullName?: string;

  @ApiProperty({
    example: 'demo@gmail.com',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    example: '01234567890',
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
    example: 'Ai Garage Auto Care',
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

  // --------select role ----
  @ApiProperty({
    example: 'GARAGE_OWNER',
    required: true,
    description: 'select your  role',
  })
  @IsString()
  @IsNotEmpty()
  @IsEnum(UserRole)
  role: UserRole;
}
