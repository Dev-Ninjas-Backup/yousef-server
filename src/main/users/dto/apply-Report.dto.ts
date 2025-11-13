import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CreateReportDto {
  @ApiProperty({
    type: 'string',
    format: 'binary',
    isArray: true,
  })
  files?: { url: string; key: string }[];

  @ApiProperty({
    example: 'This is fake article with copyright issues',
    required: true,
  })
  @IsString()
  reason: string;

  @ApiProperty({
    example: 'b014564b-4712-4832-b600-8fe33f8d5b40',
    required: true,
  })
  @IsString()
  contentId: string;  

}
