import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsEmail,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateGarageDto {
  @ApiProperty({
    description: 'Name of the garage',
    example: 'Elite Auto Repair',
  })
  @IsString()
  name: string;

  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: 'Cover photo file upload',
    required: false,
  })
  @IsOptional()
  coverPhoto?: Express.Multer.File;

  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: 'Profile image file upload',
    required: false,
  })
  @IsOptional()
  profileImage?: Express.Multer.File;

  @ApiProperty({
    description: 'Contact phone number',
    example: '+971-50-123-4567',
    required: false,
  })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({
    description: 'Contact email',
    example: 'contact@eliteauto.com',
    required: false,
  })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({
    description: 'Street address',
    example: '123 Sheikh Zayed Road',
    required: false,
  })
  @IsString()
  @IsOptional()
  street?: string;

  @ApiProperty({ description: 'City', example: 'Dubai', required: false })
  @IsString()
  @IsOptional()
  city?: string;

  @ApiProperty({ description: 'Emirate', example: 'Dubai', required: false })
  @IsString()
  @IsOptional()
  emirate?: string;

  @ApiProperty({
    description: 'Full address shown to user (from Google Places)',
    example: 'Al Quoz Industrial Area 3 - Dubai',
  })
  @IsString()
  @IsNotEmpty()
  address: string;

  @ApiProperty({
    description: 'Clean formatted address from Google',
    example: 'Warehouse 12, Al Quoz 3, Dubai, United Arab Emirates',
    required: false,
  })
  @IsString()
  @IsOptional()
  formattedAddress?: string;

  @ApiProperty({
    description: 'Google Place ID - Auto filled by Google Places',
    example: 'ChIJx9pbk1oX9D4R9W7f12345678',
    required: false,
  })
  @IsString()
  @IsOptional()
  placeId?: string;

  @ApiProperty({
    description: 'Latitude - auto filled by Google Places',
    example: 25.123456,
  })
  @Type(() => Number)
  @IsNumber()
  @IsNotEmpty()
  garageLat: number;

  @ApiProperty({
    description: 'Longitude - auto filled by Google Places',
    example: 55.234567,
  })
  @Type(() => Number)
  @IsNumber()
  @IsNotEmpty()
  garageLng: number;

  @ApiProperty({
    description: 'Description',
    example: 'Specialized in luxury car repairs',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Certifications',
    example: 'ISO 9001, ASE Certified',
    required: false,
  })
  @IsString()
  @IsOptional()
  certifications?: string;

  @ApiProperty({
    description: 'Weekdays working hours',
    example: '08:00 AM - 08:00 PM',
    required: false,
  })
  @IsString()
  @IsOptional()
  weekdaysHours?: string;

  @ApiProperty({
    description: 'Weekends working hours',
    example: '09:00 AM - 06:00 PM',
    required: false,
  })
  @IsString()
  @IsOptional()
  weekendsHours?: string;

  @ApiProperty({
    description: 'Comma-separated brand expertise',
    example: 'BMW,Toyota,Nissan',
    required: false,
  })
  @IsString()
  @IsOptional()
  brandExpertise?: string;

  @ApiProperty({
    example: '["Oil Change", "Brake Repair", "Engine Diagnostics"]',
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
  @IsArray({ message: 'services must be an array' })
  services?: string[];
}
