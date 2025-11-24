import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min } from 'class-validator';

export class UpdateFreePromotionListingDto {
  @ApiProperty({
    description: 'New default free promotion listing value',
    example: 5,
  })
  @IsInt()
  @Min(0)
  value: number;
}
