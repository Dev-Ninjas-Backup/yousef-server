import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdatePasswordDto {
  @ApiPropertyOptional({
    description: 'Current password',
    example: '12345678',
  })
  @IsOptional()
  @IsString()
  currentPassword: string;
  @ApiProperty({
    description: 'New password',
    example: 'new12345678',
  })
  @IsString()
  @IsNotEmpty()
  newPassword: string;
}
