import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumberString } from 'class-validator';

export class QueryPartsCategoryDto {
  @ApiPropertyOptional({
    description: 'Search by category name',
    example: 'Engine'
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Page number for pagination',
    example: '1'
  })
  @IsOptional()
  @IsNumberString()
  page?: string;

  @ApiPropertyOptional({
    description: 'Number of items per page',
    example: '10'
  })
  @IsOptional()
  @IsNumberString()
  limit?: string;
}