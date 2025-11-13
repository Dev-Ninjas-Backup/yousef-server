import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID } from 'class-validator';

export class CreateCheckoutPlanDto {
  @ApiProperty({
    description: 'ID of the plan user wants to purchase',
    example: 'a61c9422-4067-41ec-a77b-8135626307c8',
  })
  @IsNotEmpty()
  @IsUUID()
  planId: string;
}
