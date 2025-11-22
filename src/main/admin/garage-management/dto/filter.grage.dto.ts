import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class SearchGarageDto {
  @ApiPropertyOptional({ example: 1 })
  @Type(() => Number)
  @IsNumber()
  page: number = 1;

  @ApiPropertyOptional({ example: 10 })
  @Type(() => Number)
  @IsNumber()
  limit: number = 10;

  @ApiPropertyOptional({ example: 'Auto Zone' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: '  PENDING || APPROVE || DECLINE' })
  @IsOptional()
  @IsString()
  status?: string;
}
