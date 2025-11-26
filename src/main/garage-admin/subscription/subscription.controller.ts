import { Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  GetUser,
  ValidateAuth,
  ValidateGarageOwner,
  ValidateSuperAdmin,
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
  async getCurrentPlan(@GetUser('userId') userId: string) {
    return this.subscriptionService.getCurrentPlan(userId);
  }

  @Post('approve-garage/:userId')
  @ApiOperation({
    summary: '[Super Admin] Approve garage and activate 90-day free trial',
  })
  @ValidateSuperAdmin()
  async approveGarage(@Param('userId') userId: string) {
    return this.subscriptionService.approveGarage(userId);
  }

  @Post('monthly-subscription')
  @ApiOperation({
    summary: 'Create Stripe checkout session for monthly subscription ($100)',
  })
  @ValidateAuth()
  @ValidateGarageOwner()
  async subscribeMonthly(@GetUser('userId') userId: string) {
    return this.subscriptionService.createMonthlySubscriptionSession(userId);
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
  async cancelSubscription(@GetUser('userId') userId: string) {
    return this.subscriptionService.cancelSubscription(userId);
  }
}
