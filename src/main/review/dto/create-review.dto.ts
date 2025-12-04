import { ApiProperty } from '@nestjs/swagger';
import {
  IsInt,
  IsString,
  Min,
  Max,
  IsNotEmpty,
  IsBoolean,
  IsOptional,
  IsArray,
} from 'class-validator';

export class CreateReviewDto {
  @ApiProperty({
    description: 'Overall experience rating (1-5)',
    example: 5,
    minimum: 1,
    maximum: 5,
  })
  @IsInt()
  @Min(1)
  @Max(5)
  overallExperience: number;

  @ApiProperty({
    description: 'Service quality rating (1-5)',
    example: 5,
    minimum: 1,
    maximum: 5,
  })
  @IsInt()
  @Min(1)
  @Max(5)
  serviceQuality: number;

  @ApiProperty({
    description: 'Timeliness rating (1-5)',
    example: 4,
    minimum: 1,
    maximum: 5,
  })
  @IsInt()
  @Min(1)
  @Max(5)
  timeliness: number;

  @ApiProperty({
    description: 'Value for money rating (1-5)',
    example: 5,
    minimum: 1,
    maximum: 5,
  })
  @IsInt()
  @Min(1)
  @Max(5)
  valueForMoney: number;

  @ApiProperty({
    description: 'Your comment about the garage service',
    example: 'Excellent service! Highly recommended.',
  })
  @IsString()
  @IsNotEmpty()
  comment: string;

  @ApiProperty({
    description: 'Would you recommend this garage?',
    example: true,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  recommendation?: boolean;

  @ApiProperty({
    description: 'Photo URLs',
    example: ['https://example.com/photo1.jpg'],
    required: false,
    type: [String],
  })
  @IsArray()
  @IsOptional()
  photos?: string[];
}
