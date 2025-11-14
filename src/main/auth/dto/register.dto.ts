import { ApiProperty } from '@nestjs/swagger';
import { ServiceCategory, UserRole } from '@prisma/client';
import { Transform } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
  ValidateIf,
} from 'class-validator';

export class RegisterDto {
  // ──────────────────── BASIC INFO ────────────────────
  @ApiProperty({
    example: 'Md Joy',
    description: 'Full name of the user',
    required: false,
  })
  @IsOptional()
  @IsString()
  fullName?: string;

  @ApiProperty({
    example: '68urgent@powerscrews.com',
    description: 'Valid email address',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    example: '01700000000',
    description: 'Active phone number',
  })
  @IsString()
  @IsNotEmpty()
  phone: string;

  // ──────────────────── PASSWORD ────────────────────
  @ApiProperty({
    example: '12345678',
    minLength: 6,
    description: 'Minimum 6 characters',
  })
  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @ApiProperty({
    example: '12345678',
    description: 'Must match password',
  })
  @IsNotEmpty()
  confirmPassword: string;

  // ──────────────────── USER ROLE ────────────────────

  // ──────────────────── SERVICE CATEGORIES (Only for GARAGE_OWNER) ────────────────────
  @ApiProperty({
    example: ['MECHANICAL_REPAIR', 'DIAGNOSTICS'],
    enum: ServiceCategory,
    isArray: true,
    required: false,
    description:
      'Required only when role = GARAGE_OWNER. Can also accept comma separated string.',
  })
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
  @ArrayNotEmpty({
    message: 'Select at least one service category',
  })
  @IsEnum(ServiceCategory, {
    each: true,
    message:
      'Allowed categories: MECHANICAL_REPAIR, AC_HEATING, ELECTRICAL_SYSTEMS, BODY_AND_PAINT, DIAGNOSTICS, GENERAL_MAINTENANCE',
  })
  serviceCategories?: ServiceCategory[];

  // ──────────────────── FILE UPLOADS (Swagger Preview) ────────────────────
  @ApiProperty({
    type: 'string',
    format: 'binary',
    required: false,
    description: 'Upload garage logo image',
  })
  garageLogo?: Express.Multer.File;

  @ApiProperty({
    type: 'string',
    format: 'binary',
    required: false,
    description: 'Upload trade license document/image',
  })
  tradeLicense?: Express.Multer.File;
}
