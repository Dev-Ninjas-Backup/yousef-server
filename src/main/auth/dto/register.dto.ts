import {  ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class RegisterDto {

   @ApiProperty({
     example: 'Md Nadim',
     description: 'Full name of the user',
     required: false,
   })
   @IsOptional()
   @IsString()
   fullName?: string;

  @ApiProperty({
    example: '68urgent@powerscrews.com',
    description: 'Valid email address',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: '12345678',
    description: 'Password (min 6 characters)',
  })
  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @ApiProperty({
    example: '12345678',
    description: 'Confirm password (checked in service)',
  })
  @IsNotEmpty()
  confirmPassword: string;
}
