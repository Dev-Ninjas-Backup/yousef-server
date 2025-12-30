import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUUID } from 'class-validator';

export class CreateGarageAdminReplyDto {
  @ApiProperty({ description: 'Contact thread ID' })
  @IsUUID()
  contactId: string;

  @ApiProperty({ description: 'Reply text' })
  @IsString()
  content: string;
}
