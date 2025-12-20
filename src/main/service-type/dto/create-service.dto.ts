import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CreateServiceTypeDto {
  @ApiProperty({
    description: 'Service category name',
    example: 'Oil Change',
  })
  @IsString()
  serviceCategory: string;
}
