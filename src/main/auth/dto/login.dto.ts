import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    example: 'superadmin@gmail.com',
    description: 'Valid email address here',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: '12345678',
    description: 'Password (minimum 8 characters)',
  })
  @IsNotEmpty()
  @MinLength(8)
  password: string;
}
