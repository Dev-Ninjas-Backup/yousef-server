// src/auth/dto/register.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
  IsArray,
  ArrayNotEmpty,
  ValidateIf,
} from 'class-validator';
import { UserRole, ServiceCategory } from '@prisma/client';

export class RegisterDto {
  @ApiProperty({
    example: 'Md joy',
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
    description: 'Phone number of the user',
  })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiProperty({
    example: '12345678',
    description: 'Password (min 6 characters)',
  })
  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @ApiProperty({
    example: '12345678',
    description: 'Confirm password (checked in service)',
  })
  @IsNotEmpty()
  confirmPassword: string;

  @ApiProperty({
    example: 'GARAGE_OWNER',
    enum: UserRole,
    description: 'Role of the user',
  })
  @IsEnum(UserRole)
  role: UserRole;

  // ---------- MULTIPLE CATEGORIES ----------
  @ApiProperty({
    type: [String],
    enum: ServiceCategory,
    example: ['MECHANICAL_REPAIR', 'BODY_AND_PAINT'],
    description:
      'Service categories the garage offers. **Required when role = GARAGE_OWNER**',
    required: false,
  })

  @IsOptional()
  @IsArray()
  @IsEnum(ServiceCategory, { each: true })
  @ValidateIf((o) => o.role === UserRole.GARAGE_OWNER)
  @ArrayNotEmpty({
    message: 'At least one service category is required for GARAGE_OWNER',
  })
  serviceCategories?: ServiceCategory[];
}
