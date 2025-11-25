import { Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import {
  GetUser,
  ValidateAuth,
  ValidateGarageOwner,
  ValidateSuperAdmin,
} from 'src/common/jwt/jwt.decorator';
import { SubscriptionService } from './subscription.service';

@Controller('subscription')
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) { }

  @Get('current-plan')
  @ApiBearerAuth()
  @ValidateAuth()
  async getTrialStatus(@GetUser('userId') userId: string) {
    return this.subscriptionService.getTrialStatus(userId);
  }

  // Admin only: Approve garage and start trial
  @ApiBearerAuth()
  @ValidateSuperAdmin()
  @Post('approve-garage/:userId')
  async approveGarage(@Param('userId') userId: string) {
    return this.subscriptionService.approveGarage(userId);
  }

  // Create monthly subscription checkout session
  @ApiBearerAuth()
  @ValidateAuth()
  @ValidateGarageOwner()
  @Post('monthly-subscription')
  async subscribeMonthly(@GetUser('userId') userId: string) {
    return this.subscriptionService.createMonthlySubscriptionSession(userId);
  }

  // Get subscription history
  @ApiBearerAuth()
  @ValidateAuth()
  @ValidateGarageOwner()
  @Get('transaction-history')
  async getHistory(@GetUser('userId') userId: string) {
    return this.subscriptionService.getSubscriptionHistory(userId);
  }

  // Cancel subscription
  @ApiBearerAuth()
  @ValidateAuth()
  @ValidateGarageOwner()
  @Patch('cancel-subscription')
  async cancelSubscription(@GetUser('userId') userId: string) {
    return this.subscriptionService.cancelSubscription(userId);
  }
}
