import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumberString } from 'class-validator';

export class QueryGarageDto {
  @ApiPropertyOptional({
    description: 'Search by garage name, city, or emirate',
    example: 'Dubai',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter by city',
    example: 'Dubai',
  })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({
    description: 'Filter by emirate',
    example: 'Dubai',
  })
  @IsOptional()
  @IsString()
  emirate?: string;

  @ApiPropertyOptional({
    description: 'Filter by service type name',
    example: 'Oil Change',
  })
  @IsOptional()
  @IsString()
  serviceName?: string;

  @ApiPropertyOptional({
    description: 'Page number for pagination',
    example: '1',
  })
  @IsOptional()
  @IsNumberString()
  page?: string;

  @ApiPropertyOptional({
    description: 'Number of items per page',
    example: '10',
  })
  @IsOptional()
  @IsNumberString()
  limit?: string;

  @ApiPropertyOptional({
    description: 'Filter by status',
    example: 'APPROVED',
    enum: ['PENDING', 'APPROVED', 'REJECTED'],
  })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({
    description: 'Filter by brand expertise (e.g. American cars)',
    example: 'American cars',
  })
  @IsOptional()
  @IsString()
  brandExpertise?: string;

  @ApiPropertyOptional({
    description: 'Sort field (e.g. distance, rating)',
    example: 'distance',
  })
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiPropertyOptional({
    description: 'User latitude for distance sorting',
    example: '25.2048',
  })
  @IsOptional()
  @IsString()
  userLat?: string;

  @ApiPropertyOptional({
    description: 'User longitude for distance sorting',
    example: '55.2708',
  })
  @IsOptional()
  @IsString()
  userLng?: string;
}
