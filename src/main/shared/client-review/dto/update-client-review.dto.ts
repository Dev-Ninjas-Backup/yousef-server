import { PartialType } from '@nestjs/swagger';
import { CreateClientReviewDto } from './create-client-review.dto';

export class UpdateClientReviewDto extends PartialType(CreateClientReviewDto) {}
