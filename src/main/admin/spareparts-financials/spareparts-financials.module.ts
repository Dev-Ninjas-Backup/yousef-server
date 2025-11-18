import { Module } from '@nestjs/common';
import { SparepartsFinancialsController } from './controller/spareparts-financials.controller';
import { SparepartsFinancialsService } from './service/spareparts-financials.service';

@Module({
  controllers: [SparepartsFinancialsController],
  providers: [SparepartsFinancialsService],
})
export class SparepartsFinancialsModule {}
