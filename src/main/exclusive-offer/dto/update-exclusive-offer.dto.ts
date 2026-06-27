import { PartialType } from '@nestjs/swagger';
import { CreateExclusiveOfferDto } from './create-exclusive-offer.dto';

export class UpdateExclusiveOfferDto extends PartialType(
  CreateExclusiveOfferDto,
) {}
