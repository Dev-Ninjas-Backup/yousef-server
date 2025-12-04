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
  ProductApproveUpdate?: boolean = false;

  @ApiPropertyOptional({
    description: 'Receive productApproveUpdate status notifications',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  CustomerInquiryAlert?: boolean = false;

  @ApiPropertyOptional({
    description: 'Receive CustomerInquiryAlert notifications',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  NewMessage?: boolean = false;

  @ApiPropertyOptional({
    description: 'Receive  new message notifications',
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
