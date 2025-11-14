import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateServiceTypeDto {
  @ApiProperty({
    description: 'Service icon URL',
    example: 'https://example.com/icons/oil-change.png',
  })
  @IsString()
  icon: string;

  @ApiProperty({
    description: 'Unique service name',
    example: 'Oil Change',
  })
  @IsString()
  name: string;
}
