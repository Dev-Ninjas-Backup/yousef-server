import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { PaginationDto } from 'src/common/dto/pagination';

export class UserSearchDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Search by name, email, or phone' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by role', enum: ['CAR_OWNER', 'GARAGE_OWNER', 'SUPER_ADMIN', 'MEMBER'] })
  @IsOptional()
  @IsString()
  role?: string;
}