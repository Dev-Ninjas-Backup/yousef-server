import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateProfileDto {
  @ApiProperty({
    type: 'string',
    format: 'binary',
    required: false,
  })
  @IsOptional()
  file?: Express.Multer.File;

  @ApiProperty({
    example: 'Hazel Wise',
    description: 'Full name of the user',
    required: false,
  })
  @IsOptional()
  @IsString()
  fullName?: string;

  @ApiProperty({
    example:
      'Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry',
    description: 'bio or about',
    required: false,
  })
  @IsOptional()
  @IsString()
  bio?: string;

  @ApiProperty({
    example: '1234567890',
    description: 'Phone number of the user',
    required: false,
  })
  @IsOptional()
  @IsString()
  phoneNumber?: string;
  // ------------------ address-------------------
  @ApiProperty({
    example: '1343 Main street',
    description: '1343 Main street',
    required: false,
  })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({
    example: 'doha',
    description: 'Enter the city ',
    required: false,
  })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiProperty({
    example: 'abb-4',
    description: 'Enter the Emirate',
    required: false,
  })
  @IsOptional()
  @IsString()
  emirate?: string;
}
