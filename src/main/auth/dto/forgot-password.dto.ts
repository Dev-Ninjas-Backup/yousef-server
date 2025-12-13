import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class ForgetPasswordAuthDto {
  @ApiProperty({ example: 'demo@gmail.com' })
  @IsString()
  email: string;
}
