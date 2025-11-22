import { Module } from '@nestjs/common';
import { PromotionalAdController } from './promotional-ad.controller';
import { PromotionalAdService } from './promotional-ad.service';
import { PrismaModule } from '../../../lib/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [PromotionalAdController],
  providers: [PromotionalAdService]
})
export class PromotionalAdModule {}