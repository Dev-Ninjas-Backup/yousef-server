import { IsString, IsOptional, IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateGarageDto {
  @ApiProperty({ description: 'Unique name of the garage', example: 'Elite Auto Repair' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'URL of the garage cover photo', example: 'https://example.com/cover.jpg', required: false })
  @IsString()
  @IsOptional()
  coverPhoto?: string;

  @ApiProperty({ description: 'URL of the garage profile image', example: 'https://example.com/profile.jpg', required: false })
  @IsString()
  @IsOptional()
  profileImage?: string;

  @ApiProperty({ description: 'Contact phone number of the garage', example: '+971-50-123-4567', required: false })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({ description: 'Contact email of the garage', example: 'contact@eliteauto.com', required: false })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({ description: 'Street address of the garage', example: '123 Sheikh Zayed Road', required: false })
  @IsString()
  @IsOptional()
  street?: string;

  @ApiProperty({ description: 'City where the garage is located', example: 'Dubai', required: false })
  @IsString()
  @IsOptional()
  city?: string;

  @ApiProperty({ description: 'Emirate where the garage is located', example: 'Dubai', required: false })
  @IsString()
  @IsOptional()
  emirate?: string;

  @ApiProperty({ description: 'Description of the garage services', example: 'Specialized in luxury car repairs', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'Certifications held by the garage', example: 'ISO 9001, ASE Certified', required: false })
  @IsString()
  @IsOptional()
  certifications?: string;
}
