import { ApiProperty } from '@nestjs/swagger';

export class CreateTestawDto {
  @ApiProperty({
    description: 'Image file to upload',
    type: 'string',
    format: 'binary',
  })
  file: any;
}
