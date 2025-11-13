import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';

export class NotificationToggleDto {
  @ApiPropertyOptional({
    description: 'Receive email notifications',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  email?: boolean = false;

  @ApiPropertyOptional({
    description: 'Receive communication notifications',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  communication?: boolean = false;



  
  @ApiPropertyOptional({
    description: 'Receive tasks and projects content status notifications',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  contentStatus?: boolean = false;

  @ApiPropertyOptional({
    description: 'Receive scheduling notifications',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  scheduling?: boolean = false;

  @ApiPropertyOptional({
    description: 'Receive message notifications',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  message?: boolean = false;

  @ApiPropertyOptional({
    description: 'Receive user registration notifications',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  userRegistration?: boolean = false;
}
