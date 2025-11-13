import { ApiProperty } from '@nestjs/swagger';
import { 
  IsEmail, 
  IsEnum, 
  IsNotEmpty, 
  IsOptional, 
  IsString, 
  MinLength, 
  IsBoolean 
} from 'class-validator';
import { UserRole, ServiceCategory } from '@prisma/client'; // import enums directly from Prisma types

export class RegisterDto {
  @ApiProperty({
    example: 'Md Nadim',
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
    description: 'Role of the user (CAR_OWNER, GARAGE_OWNER, SUPER_ADMIN, MEMBER)',
  })
  @IsEnum(UserRole)
  role: UserRole;

  @ApiProperty({
    example: 'MECHANICAL_REPAIR',
    enum: ServiceCategory,
    required: false,
    description: 'Service category (optional, required for GARAGE_OWNER)',
  })
  @IsOptional()
  @IsEnum(ServiceCategory)
  serviceCategory?: ServiceCategory;

  @ApiProperty({
    example: false,
    description: 'Whether review alerts are enabled',
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  reviewAlerts?: boolean;
}
