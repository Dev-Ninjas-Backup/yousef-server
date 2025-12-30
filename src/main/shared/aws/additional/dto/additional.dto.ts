import { ApiProperty } from '@nestjs/swagger';

export class AdditionalDto {
  @ApiProperty({
    description: 'File to upload only one file -------------------------',
    type: 'string',
    format: 'binary',
  })
  file: any;
}

export class AdditionalMultipleDto {
  @ApiProperty({
    description: 'Multiple files to upload TO S3',
    type: 'string',
    format: 'binary',
    isArray: true,
  })
  files: any[];
}
