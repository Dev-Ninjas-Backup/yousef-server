import { Module } from '@nestjs/common';
import { PartsFinancialsController } from './conroller/parts-financials.controller';
import { PartsFinancialsService } from './service/parts-financials.service';

@Module({
  controllers: [PartsFinancialsController],
  providers: [PartsFinancialsService],
})
export class PartsFinancialsModule {}
