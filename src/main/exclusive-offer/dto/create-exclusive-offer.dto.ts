import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateExclusiveOfferDto {
  @ApiProperty({ example: 'Toyota Brake Pad 30% Off' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    example: 'Get 30% off on all genuine Toyota brake pads this week.',
  })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ example: 'Valid until 7/27/2026' })
  @IsString()
  @IsNotEmpty()
  validUnit: string;

  @ApiProperty({ example: '150', required: false })
  @IsString()
  @IsOptional()
  originalPrice?: string;

  @ApiProperty({ example: '100', required: false })
  @IsString()
  @IsOptional()
  price?: string;

  @ApiProperty({ example: 'Toyota', required: false })
  @IsString()
  @IsOptional()
  brand?: string;

  @ApiProperty({ example: 'garage-uuid-here', required: false })
  @IsString()
  @IsOptional()
  garageId?: string;
}
