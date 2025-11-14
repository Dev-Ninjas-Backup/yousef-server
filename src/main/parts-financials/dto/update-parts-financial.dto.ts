import { PartialType } from '@nestjs/swagger';
import { CreatePartsFinancialDto } from './create-parts-financial.dto';

export class UpdatePartsFinancialDto extends PartialType(CreatePartsFinancialDto) {}
