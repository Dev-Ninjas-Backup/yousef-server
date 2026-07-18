import { Body, Controller, Get, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  GetUser,
  ValidateAuth,
  ValidateGarageOwner,
} from 'src/common/jwt/jwt.decorator';
import { SubscriptionService } from './subscription.service';

@ApiTags('Subscription')
@ApiBearerAuth()
@Controller('subscription')
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  @Get('current-plan')
  @ApiOperation({
    summary: 'Get current plan & trial status for logged-in garage owner',
  })
  @ValidateAuth()
  async getCurrentPlan(
    @GetUser('userId') userId: string,
    @Query('garageId') garageId?: string,
  ) {
    return this.subscriptionService.getCurrentPlan(userId, garageId);
  }

  @Post('monthly-subscription')
  @ApiOperation({
    summary: 'Create Stripe checkout session for monthly subscription ($100)',
  })
  @ValidateAuth()
  @ValidateGarageOwner()
  async subscribeMonthly(
    @GetUser('userId') userId: string,
    @Body('garageId') bodyGarageId?: string,
    @Query('garageId') queryGarageId?: string,
  ) {
    const garageId = bodyGarageId || queryGarageId;
    return this.subscriptionService.createMonthlySubscriptionSession(
      userId,
      garageId,
    );
  }

  @Get('transaction-history')
  @ApiOperation({ summary: 'Get formatted transaction history (Trial + Paid)' })
  @ValidateAuth()
  @ValidateGarageOwner()
  async getHistory(@GetUser('userId') userId: string) {
    return this.subscriptionService.getSubscriptionHistory(userId);
  }

  @Patch('cancel-subscription')
  @ApiOperation({
    summary: 'Cancel active paid subscription (immediate or at period end)',
  })
  @ValidateAuth()
  @ValidateGarageOwner()
  async cancelSubscription(
    @GetUser('userId') userId: string,
    @Body('garageId') bodyGarageId?: string,
    @Query('garageId') queryGarageId?: string,
  ) {
    const garageId = bodyGarageId || queryGarageId;
    return this.subscriptionService.cancelSubscription(userId, garageId);
  }

  @Patch('downgrade-product-plan')
  @ApiOperation({
    summary: 'Downgrade active product monthly subscription on next renewal',
  })
  @ValidateAuth()
  async downgradeProductPlan(
    @GetUser('userId') userId: string,
    @Body('planType') planType: string,
  ) {
    return this.subscriptionService.downgradeProductPlan(userId, planType);
  }

  @Patch('cancel-product-plan')
  @ApiOperation({
    summary: 'Cancel active product monthly subscription at period end',
  })
  @ValidateAuth()
  async cancelProductMonthly(@GetUser('userId') userId: string) {
    return this.subscriptionService.cancelProductMonthly(userId);
  }
}
