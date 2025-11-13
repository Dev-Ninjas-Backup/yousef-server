import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';

export class CreateSubscribeDto {
  @ApiProperty({
    example: 'gretaltan@somoj.com',
    description: 'Email address for subscribing to the newsletter',
  })
  @IsEmail()
  email: string;
}
