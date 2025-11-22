import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { ValidateUser, GetUser } from 'src/common/jwt/jwt.decorator';
import { PromotionalAdService } from './promotional-ad.service';

@Controller('promotional-ad')
export class PromotionalAdController {
  constructor(private readonly promotionalAdService: PromotionalAdService) {}

  @ApiBearerAuth()
  @ValidateUser()
  @Get('promoted-products')
  async getPromotedProducts(@GetUser('userId') userId: string) {
    return this.promotionalAdService.getPromotedProducts(userId);
  }
}
