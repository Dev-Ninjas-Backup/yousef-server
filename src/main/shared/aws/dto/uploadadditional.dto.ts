import { ApiProperty } from '@nestjs/swagger';

export class Additionaldto {
  @ApiProperty({
    description: 'Image file to upload',
    type: 'string',
    format: 'binary',
  })
  file: any;
}

export class AdditionalMultipleDto {
  @ApiProperty({
    description: 'Multiple image files to upload',
    type: 'string',
    format: 'binary',
    isArray: true,
  })
  files: any[];
}
