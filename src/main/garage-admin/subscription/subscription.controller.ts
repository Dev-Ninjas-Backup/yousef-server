import { Controller, Get, Param, Post } from '@nestjs/common';
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

  @Get('trial-status')
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

  // Get subscription status
  @ApiBearerAuth()
  @ValidateAuth()
  @ValidateGarageOwner()
  @Get('status')
  async checkStatus(@GetUser('userId') userId: string) {
    return this.subscriptionService.checkSubscriptionStatus(userId);
  }

  // Create monthly subscription checkout session
  @ApiBearerAuth()
  @ValidateAuth()
  @ValidateGarageOwner()
  @Post('subscribe-monthly')
  async subscribeMonthly(@GetUser('userId') userId: string) {
    return this.subscriptionService.createMonthlySubscriptionSession(userId);
  }

  // Get subscription history
  @ApiBearerAuth()
  @ValidateAuth()
  @ValidateGarageOwner()
  @Get('history')
  async getHistory(@GetUser('userId') userId: string) {
    return this.subscriptionService.getSubscriptionHistory(userId);
  }
}
