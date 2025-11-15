import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
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
