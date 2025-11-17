import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreatePartsCategoryDto {
  @ApiProperty({
    description: 'Name of the parts category',
    example: 'Engine Parts',
  })
  @IsString()
  @IsNotEmpty()
  name: string;
}
