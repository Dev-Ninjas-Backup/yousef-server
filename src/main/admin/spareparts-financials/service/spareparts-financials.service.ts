import { Injectable } from '@nestjs/common';
import { CreateSparepartsFinancialDto } from '../dto/create-spareparts-financial.dto';
import { UpdateSparepartsFinancialDto } from '../dto/update-spareparts-financial.dto';

@Injectable()
export class SparepartsFinancialsService {
  create(createSparepartsFinancialDto: CreateSparepartsFinancialDto) {
    return 'This action adds a new sparepartsFinancial';
  }

  findAll() {
    return `This action returns all sparepartsFinancials`;
  }

  findOne(id: number) {
    return `This action returns a #${id} sparepartsFinancial`;
  }

  update(
    id: number,
    updateSparepartsFinancialDto: UpdateSparepartsFinancialDto,
  ) {
    return `This action updates a #${id} sparepartsFinancial`;
  }

  remove(id: number) {
    return `This action removes a #${id} sparepartsFinancial`;
  }
}
