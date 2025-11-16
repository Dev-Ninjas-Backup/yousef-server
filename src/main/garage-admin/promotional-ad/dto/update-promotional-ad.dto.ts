import { OmitType, PartialType } from '@nestjs/swagger';
import { CreatePromotionalAdDto } from './create-promotional-ad.dto';

enum PromotionAdStatus {
    PENDING = 'PENDING',
    APPROVED = 'APPROVED',
    REJECT = 'REJECT'
}

export class UpdatePromotionalAdDto extends PartialType(OmitType(CreatePromotionalAdDto, ['productId', 'userId'])) {
    // @ApiPropertyOptional({ enum: PromotionAdStatus })
    // @IsOptional()
    // @IsEnum(PromotionAdStatus)
    // status?: PromotionAdStatus;
}