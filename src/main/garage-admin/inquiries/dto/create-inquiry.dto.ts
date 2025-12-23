import { ApiProperty } from '@nestjs/swagger';
import { ContactSubject } from '@prisma/client';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MinLength,
} from 'class-validator';

export class CreateInquiryDto {
  @ApiProperty({ example: 'John', description: 'Sender first name' })
  @IsNotEmpty()
  @IsString()
  FirstName: string;

  @ApiProperty({ example: 'Doe', description: 'Sender last name' })
  @IsNotEmpty()
  @IsString()
  LastName: string;

  @ApiProperty({
    example: 'shahsultan@softvence.com',
    description: 'Sender email address',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    enum: ContactSubject,
    example: ContactSubject.OTHERS,
    description: 'Reason for contacting',
  })
  @IsEnum(ContactSubject)
  subject: ContactSubject;

  @ApiProperty({
    example: 'I need brake repair for my Toyota Corolla.',
    description: 'Message content from the sender',
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(10, {
    message: 'Message must be at least 10 characters long',
  })
  message: string;

  @ApiProperty({
    example: 'some other subject',
    description: 'Message content from the sender',
    required: false,
  })
  @IsString()
  @IsOptional()
  othersubject?: string;

  @ApiProperty({
    example: 'c1ca7046-0f2c-4028-882e-022d68ca67e6',
    description: 'Garage owner user ID receiving this inquiry',
  })
  @IsUUID()
  @IsNotEmpty()
  garageOwnerId: string;
}
