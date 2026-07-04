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
  @ApiProperty({ example: 'Md' })
  @IsString()
  @IsNotEmpty()
  FirstName: string;

  @ApiProperty({ example: 'Nadim' })
  @IsString()
  @IsNotEmpty()
  LastName: string;

  @ApiProperty({ example: 'example@gmail.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ enum: ContactSubject, example: ContactSubject.OTHERS })
  @IsEnum(ContactSubject)
  subject: ContactSubject;

  @ApiProperty({ example: 'I need a car engine replacement' })
  @IsString()
  @IsNotEmpty()
  message: string;

  @ApiProperty({
    example: 'some other subject',
    required: false,
  })
  @IsString()
  @IsOptional()
  othersubject?: string;

  @ApiProperty({
    example: 'garage-owner-uuid-here',
    required: false,
  })
  @IsString()
  @IsOptional()
  garageOwnerId?: string;

  @ApiProperty({
    example: '+971 6 543 5678',
    required: false,
  })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({
    example: '150',
    required: false,
  })
  @IsString()
  @IsOptional()
  priceBeforeDiscount?: string;

  @ApiProperty({
    example: '100',
    required: false,
  })
  @IsString()
  @IsOptional()
  priceAfterDiscount?: string;

  @ApiProperty({
    example: '3 days',
    required: false,
  })
  @IsString()
  @IsOptional()
  offerDuration?: string;
}
