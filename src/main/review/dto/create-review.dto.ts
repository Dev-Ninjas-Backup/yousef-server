import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsString, Min, Max, IsNotEmpty } from 'class-validator';

export class CreateReviewDto {
  @ApiProperty({
    description: 'Rating for the garage (1-5)',
    example: 5,
    minimum: 1,
    maximum: 5,
  })
  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiProperty({
    description: 'Your comment about the garage service',
    example:
      'This garage service is awesome! Great customer service and quality work.',
  })
  @IsString()
  @IsNotEmpty()
  comment: string;
}
