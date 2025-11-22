import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
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

  @ApiBearerAuth()
  @ValidateUser()
  @Get('stats')
  @ApiOperation({ summary: 'Get user analytics/stats' })
  @ApiResponse({
    status: 200,
    description: 'User statistics retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        freeListingUsed: {
          type: 'number',
          description: 'Number of free listings used by user',
          example: 2,
        },
        activeAds: {
          type: 'number',
          description: 'Number of active promoted ads',
          example: 5,
        },
        pendingApproval: {
          type: 'number',
          description: 'Number of products pending approval',
          example: 3,
        },
      },
    },
  })
  async getUserStats(@GetUser('userId') userId: string) {
    return this.promotionalAdService.getUserStats(userId);
  }
}
