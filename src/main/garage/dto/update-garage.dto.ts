import { PartialType } from '@nestjs/mapped-types';
import { CreateGarageDto } from './create-garage.dto';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateGarageDto extends PartialType(CreateGarageDto) {
  @ApiProperty({
    description: 'Unique name of the garage (optional for update)',
    example: 'Elite Auto Repair',
    required: false,
  })
  name?: string;
}
