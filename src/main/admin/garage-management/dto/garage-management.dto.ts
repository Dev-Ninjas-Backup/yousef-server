import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsArray } from 'class-validator';
import { GarageStatus } from '@prisma/client';

export class UpdateGarageDto {
  @ApiPropertyOptional({
    enum: GarageStatus,
    description: 'Garage status update (APPROVE, DECLINE, PENDING)',
  })
  @IsOptional()
  @IsEnum(GarageStatus)
  garageStatus?: GarageStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  garageName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  emirate?: string;
}
export class UpdateGarageStatusDto {
  @ApiProperty({
    enum: GarageStatus,
    description: 'Select the new garage status',
    example: GarageStatus.APPROVE,
  })
  @IsEnum(GarageStatus, {
    message: 'garageStatus must be APPROVE, PENDING, or DECLINE',
  })
  garageStatus: GarageStatus;
}

export class ReviewBrandExpertiseDto {
  @ApiProperty({
    description: 'Array of brand expertise strings to approve/reject',
    example: ['American cars', 'Japanese cars'],
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  brands: string[];

  @ApiPropertyOptional({
    description: 'Reason of rejection/decline',
    example: 'Invalid certification uploaded',
  })
  @IsOptional()
  @IsString()
  reason?: string;
}
