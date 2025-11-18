import { PartialType } from '@nestjs/swagger';
import { CreateSparepartsFinancialDto } from './create-spareparts-financial.dto';

export class UpdateSparepartsFinancialDto extends PartialType(
  CreateSparepartsFinancialDto,
) {}
