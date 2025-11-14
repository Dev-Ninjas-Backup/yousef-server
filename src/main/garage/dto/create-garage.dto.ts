import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString } from 'class-validator';

export class CreateGarageDto {
  @ApiProperty({ description: 'Unique name of the garage', example: 'Elite Auto Repair' })
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

  @ApiProperty({ description: 'Contact phone number', example: '+971-50-123-4567', required: false })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({ description: 'Contact email', example: 'contact@eliteauto.com', required: false })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({ description: 'Street address', example: '123 Sheikh Zayed Road', required: false })
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

  @ApiProperty({ description: 'Description', example: 'Specialized in luxury car repairs', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'Certifications', example: 'ISO 9001, ASE Certified', required: false })
  @IsString()
  @IsOptional()
  certifications?: string;

  @ApiProperty({ description: 'Weekdays working hours', example: '08:00 AM - 08:00 PM', required: false })
  @IsString()
  @IsOptional()
  weekdaysHours?: string;

  @ApiProperty({ description: 'Weekends working hours', example: '09:00 AM - 06:00 PM', required: false })
  @IsString()
  @IsOptional()
  weekendsHours?: string;

  @ApiProperty({ description: 'Comma-separated brand expertise', example: 'BMW,Toyota,Nissan', required: false })
  @IsString()
  @IsOptional()
  brandExpertise?: string;
}