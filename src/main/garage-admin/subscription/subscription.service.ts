import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/lib/prisma/prisma.service';
import { PaymentService } from 'src/main/shared/payment/service/payment.service';

@Injectable()
export class SubscriptionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly paymentService: PaymentService,
  ) {}

  // Approve garage and activate 90-day free trial
  async approveGarage(userId: string): Promise<{ message: string }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.garageStatus !== 'PENDING') {
      throw new NotFoundException('Garage is not in pending status');
    }

    const now = new Date();
    const trialEnd = new Date(now);
    trialEnd.setDate(trialEnd.getDate() + 90);

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        garageStatus: 'APPROVE',
        subscriptionTrialStartDate: now,
        subscriptionTrialEndDate: trialEnd,
        isSubscriptionTrialActive: true,
      },
    });

    return { message: 'Garage approved and 90-day trial activated' };
  }

  // Check subscription status
  async checkSubscriptionStatus(userId: string): Promise<any> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        garageStatus: true,
        subscriptionTrialStartDate: true,
        subscriptionTrialEndDate: true,
        isSubscriptionTrialActive: true,
        subscriptionStartDate: true,
        subscriptionEndDate: true,
        nextSubscriptionBillingDate: true,
        isSubscribed: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const now = new Date();

    if (
      user.isSubscriptionTrialActive &&
      user.subscriptionTrialEndDate &&
      user.subscriptionTrialEndDate > now
    ) {
      return {
        status: 'trial_active',
        endsAt: user.subscriptionTrialEndDate,
        daysRemaining: Math.ceil(
          (user.subscriptionTrialEndDate.getTime() - now.getTime()) /
            (1000 * 60 * 60 * 24),
        ),
      };
    } else if (
      user.isSubscribed &&
      user.subscriptionEndDate &&
      user.subscriptionEndDate > now
    ) {
      return {
        status: 'paid_active',
        endsAt: user.subscriptionEndDate,
        nextBilling: user.nextSubscriptionBillingDate,
      };
    } else {
      // Expire trial if needed
      if (user.isSubscriptionTrialActive) {
        await this.prisma.user.update({
          where: { id: userId },
          data: {
            isSubscriptionTrialActive: false,
          },
        });
      }
      return { status: 'expired', message: 'Subscription required' };
    }
  }

  // Create monthly subscription session ($100)
  async createMonthlySubscriptionSession(
    userId: string,
  ): Promise<{ url: string }> {
    return this.paymentService.createMonthlyPlanSession(userId);
  }
}
