// src/main/shared/admin-message/dto/create-admin-reply.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUUID } from 'class-validator';

export class CreateAdminReplyDto {
  @ApiProperty({ description: 'Contact thread ID' })
  @IsUUID()
  contactId: string;

  @ApiProperty({ description: 'Reply text' })
  @IsString()
  content: string;
}
