import { ApiProperty } from '@nestjs/swagger';
import { ContactSubject } from '@prisma/client';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateContactDto {
  @ApiProperty({ example: 'Md', description: 'First name of the sender' })
  @IsString()
  @IsNotEmpty()
  FirstName: string;

  @ApiProperty({ example: 'Nadim', description: 'Last name of the sender' })
  @IsString()
  @IsNotEmpty()
  LastName: string;

  @ApiProperty({
    example: 'example@mail.com',
    description: 'Email of the sender',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: 'CAR_PARTS',
    enum: ContactSubject,
    description: 'Contact subject type',
  })
  @IsEnum(ContactSubject)
  subject: ContactSubject;

  @ApiProperty({
    example: 'I need a car engine replacement',
    description: 'Message sent by the user',
  })
  @IsString()
  @IsNotEmpty()
  message: string;

  @IsString()
  @IsOptional()
  otherSubject?: string;
}
