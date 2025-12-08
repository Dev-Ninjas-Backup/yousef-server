import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateGarageDto {
  @ApiProperty({
    description: 'Name of the garage (optional for update)',
    example: 'Elite Auto Repair',
    required: false,
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: 'Cover photo file upload (optional for update)',
    required: false,
  })
  @IsOptional()
  coverPhoto?: Express.Multer.File;

  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: 'Profile image file upload (optional for update)',
    required: false,
  })
  @IsOptional()
  profileImage?: Express.Multer.File;

  @ApiProperty({
    description: 'Contact phone number (optional for update)',
    example: '+971-50-123-4567',
    required: false,
  })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({
    description: 'Contact email (optional for update)',
    example: 'contact@eliteauto.com',
    required: false,
  })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({
    description: 'Street address (optional for update)',
    example: '123 Sheikh Zayed Road',
    required: false,
  })
  @IsString()
  @IsOptional()
  street?: string;

  @ApiProperty({
    description: 'City (optional for update)',
    example: 'Dubai',
    required: false,
  })
  @IsString()
  @IsOptional()
  city?: string;

  @ApiProperty({
    description: 'Emirate (optional for update)',
    example: 'Dubai',
    required: false,
  })
  @IsString()
  @IsOptional()
  emirate?: string;

  @ApiProperty({
    description: 'Full address (optional for update)',
    example: '123 Sheikh Zayed Road, Dubai, UAE',
    required: false,
  })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiProperty({
    description: 'Formatted address (optional for update)',
    example: '123 Sheikh Zayed Road, Dubai, UAE',
    required: false,
  })
  @IsString()
  @IsOptional()
  formattedAddress?: string;

  @ApiProperty({
    description: 'Place ID (optional for update)',
    example: 'ChIJS5Y3s7V2t4kRr9n2Tt6t6t6',
    required: false,
  })
  @IsString()
  @IsOptional()
  placeId?: string;

  @ApiProperty({
    description: 'Garage latitude (optional for update)',
    example: '25.2048',
    required: false,
  })
  @Transform(({ value }) => parseFloat(value))
  @IsNumber()
  @IsOptional()
  garageLat?: number;

  @ApiProperty({
    description: 'Garage longitude (optional for update)',
    example: '55.6579',
    required: false,
  })
  @Transform(({ value }) => parseFloat(value))
  @IsNumber()
  @IsOptional()
  garageLng?: number;

  @ApiProperty({
    description: 'Description (optional for update)',
    example: 'Specialized in luxury car repairs',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Certifications (optional for update)',
    example: 'ISO 9001, ASE Certified',
    required: false,
  })
  @IsString()
  @IsOptional()
  certifications?: string;

  @ApiProperty({
    description: 'Weekdays working hours (optional for update)',
    example: '08:00 AM - 08:00 PM',
    required: false,
  })
  @IsString()
  @IsOptional()
  weekdaysHours?: string;

  @ApiProperty({
    description: 'Weekends working hours (optional for update)',
    example: '09:00 AM - 06:00 PM',
    required: false,
  })
  @IsString()
  @IsOptional()
  weekendsHours?: string;

  @ApiProperty({
    description: 'Comma-separated brand expertise (optional for update)',
    example: 'BMW,Toyota,Nissan',
    required: false,
  })
  @IsString()
  @IsOptional()
  brandExpertise?: string;
}
