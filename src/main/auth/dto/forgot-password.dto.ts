import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class ForgetPasswordAuthDto {
  @ApiProperty({ example: '68urgent@powerscrews.com' })
  @IsString()
  email: string;
}
