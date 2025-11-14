import { PartialType } from '@nestjs/mapped-types';
import { ApiProperty } from '@nestjs/swagger';
import { CreateGarageDto } from './create-garage.dto';

export class UpdateGarageDto extends PartialType(CreateGarageDto) {
  @ApiProperty({ description: 'Unique name of the garage (optional for update)', example: 'Elite Auto Repair', required: false })
  name?: string;
}