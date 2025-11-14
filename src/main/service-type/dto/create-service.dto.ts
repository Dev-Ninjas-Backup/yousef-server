import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CreateServiceTypeDto {
  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: 'Service icon file upload'
  })
  icon: Express.Multer.File;

  @ApiProperty({
    description: 'Unique service name',
    example: 'Oil Change',
  })
  @IsString()
  name: string;
}
