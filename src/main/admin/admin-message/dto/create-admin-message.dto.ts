// src/main/shared/admin-message/dto/create-admin-reply.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateAdminReplyDto {
  @ApiProperty({ description: 'Contact thread ID' })
  @IsUUID()
  contactId: string;

  @ApiProperty({ description: 'Reply text' })
  @IsString()
  content: string;

  @ApiProperty({ description: 'Optional file attachment URL', required: false })
  @IsString()
  @IsOptional()
  attachment?: string;
}
