// src/private-chat/dto/send-private-message.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID
} from 'class-validator';

export class SendPrivateMessageDto {
  @ApiProperty({
    description: 'Recipient user ID (UUID)',
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  })
  @IsUUID('4', { message: 'recipientId must be a valid UUID' })
  recipientId: string;

  @ApiProperty({
    description: 'Message text content',
    example: 'Hey! How are you?',
  })
  @IsString()
  @IsNotEmpty({ message: 'Content cannot be empty' })
  content: string;

  @ApiPropertyOptional({
    description: 'Array of uploaded file URLs (max 10)',
    type: [String],
    example: [
      'https://cdn.example.com/uploads/image1.jpg',
      'https://cdn.example.com/uploads/doc.pdf',
    ],
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10, { message: 'Maximum 10 files allowed' })
  @IsString({ each: true })
  files?: string[];

  @ApiPropertyOptional({
    description: 'ID of the message being replied to',
    example: 'c1a2e3f4-5678-90ab-cdef-1234567890ab',
  })
  @IsOptional()
  @IsUUID('4', { message: 'replyToMessageId must be a valid UUID' })
  replyToMessageId?: string;
}