import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class GeneralSettingDtoPlatform {
  @ApiPropertyOptional({ description: 'Platform name' })
  @IsOptional()
  @IsString()
  platformName?: string;

  @ApiPropertyOptional({ description: 'Support email address' })
  @IsOptional()
  @IsString()
  supportEmail?: string;

  @ApiPropertyOptional({ description: 'Description of the platform' })
  @IsOptional()
  @IsString()
  PlatformDescription?: string;
}
