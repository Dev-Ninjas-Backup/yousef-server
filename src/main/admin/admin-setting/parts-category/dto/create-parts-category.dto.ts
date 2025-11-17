import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Length, Matches } from 'class-validator';

export class CreatePartsCategoryDto {
  @ApiProperty({
    description: 'Name of the parts category',
    example: 'Engine Parts',
    minLength: 2,
    maxLength: 50,
  })
  @IsString({ message: 'Category name must be a string' })
  @IsNotEmpty({ message: 'Category name is required' })
  @Length(2, 50, {
    message: 'Category name must be between 2 and 50 characters',
  })
  @Matches(/^[a-zA-Z0-9\s\-_&]+$/, {
    message:
      'Category name can only contain letters, numbers, spaces, hyphens, underscores, and ampersands',
  })
  name: string;
}
