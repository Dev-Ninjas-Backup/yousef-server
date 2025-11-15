import { Module } from '@nestjs/common';
import { PartsFinancialsService } from './parts-financials.service';
import { PartsFinancialsController } from './parts-financials.controller';

@Module({
  controllers: [PartsFinancialsController],
  providers: [PartsFinancialsService],
})
export class PartsFinancialsModule {}
