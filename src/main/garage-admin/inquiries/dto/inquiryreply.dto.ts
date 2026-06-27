import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateGarageAdminReplyDto {
  @ApiProperty({ description: 'Contact thread ID' })
  @IsUUID()
  contactId: string;

  @ApiProperty({ description: 'Reply text' })
  @IsString()
  content: string;

  @ApiProperty({ description: 'Optional attachment URL', required: false })
  @IsString()
  @IsOptional()
  attachment?: string;
}
