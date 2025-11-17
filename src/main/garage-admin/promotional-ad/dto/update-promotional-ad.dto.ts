import { OmitType, PartialType } from '@nestjs/swagger';
import { CreatePromotionalAdDto } from './create-promotional-ad.dto';

export class UpdatePromotionalAdDto extends PartialType(
  OmitType(CreatePromotionalAdDto, [
    'userId',
    'productId',
    'paymentIntentId',
  ] as const),
) { }