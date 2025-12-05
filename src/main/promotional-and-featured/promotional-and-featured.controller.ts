import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { PromotionalAndFeaturedService } from './promotional-and-featured.service';

@ApiTags('Promotional and Featured Garages')
@Controller('promotional-and-featured')
export class PromotionalAndFeaturedController {
  constructor(
    private readonly promotionalAndFeaturedService: PromotionalAndFeaturedService,
  ) {}

  @ApiOperation({ summary: 'Get promotional products' })
  @Get('/promotional')
  async getPromotionalProducts() {
    return this.promotionalAndFeaturedService.getPromotionalProducts();
  }

  @ApiOperation({ summary: 'Get featured garages' })
  @Get('/featured')
  async getFeaturedProducts() {
    return this.promotionalAndFeaturedService.getFeaturedGarages();
  }
}
