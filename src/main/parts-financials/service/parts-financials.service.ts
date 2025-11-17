import { Injectable } from '@nestjs/common';
import { CreatePartsFinancialDto } from '../dto/create-parts-financial.dto';
import { UpdatePartsFinancialDto } from '../dto/update-parts-financial.dto';

@Injectable()
export class PartsFinancialsService {
  create(createPartsFinancialDto: CreatePartsFinancialDto) {
    return 'This action adds a new partsFinancial';
  }

  findAll() {
    return `This action returns all partsFinancials`;
  }

  findOne(id: number) {
    return `This action returns a #${id} partsFinancial`;
  }

  update(id: number, updatePartsFinancialDto: UpdatePartsFinancialDto) {
    return `This action updates a #${id} partsFinancial`;
  }

  remove(id: number) {
    return `This action removes a #${id} partsFinancial`;
  }
}
