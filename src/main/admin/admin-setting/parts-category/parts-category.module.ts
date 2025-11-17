import { Module } from '@nestjs/common';
import { PartsCategoryController } from './parts-category.controller';
import { PartsCategoryService } from './parts-category.service';

@Module({
  controllers: [PartsCategoryController],
  providers: [PartsCategoryService]
})
export class PartsCategoryModule {}
