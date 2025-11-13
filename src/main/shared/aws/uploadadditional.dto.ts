import { ApiProperty } from '@nestjs/swagger';

export class Additionaldto {
  @ApiProperty({
    description: 'Image file to upload',
    type: 'string',
    format: 'binary',
  })
  file: any;
}
