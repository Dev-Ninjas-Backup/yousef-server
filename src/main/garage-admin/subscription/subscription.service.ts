import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/lib/prisma/prisma.service';
import { PaymentService } from 'src/main/shared/payment/service/payment.service';

@Injectable()
export class SubscriptionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly paymentService: PaymentService,
  ) {}

  async getCurrentPlan(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        subscriptionTrialStartDate: true,
        subscriptionTrialEndDate: true,
        isSubscriptionTrialActive: true,

        isSubscribed: true,
        subscriptionStartDate: true,
        subscriptionEndDate: true,
        nextSubscriptionBillingDate: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const now = new Date();

    // -------------------------------
    // 1. ACTIVE TRIAL
    // -------------------------------
    if (
      user.isSubscriptionTrialActive &&
      user.subscriptionTrialEndDate &&
      user.subscriptionTrialEndDate > now
    ) {
      const daysRemaining = Math.ceil(
        (user.subscriptionTrialEndDate.getTime() - now.getTime()) /
          (1000 * 60 * 60 * 24),
      );

      return {
        planType: 'TRIAL',
        status: 'active',
        startDate: user.subscriptionTrialStartDate,
        endDate: user.subscriptionTrialEndDate,
        daysRemaining,
        message: 'Free trial is currently active',
      };
    }

    // -------------------------------
    // 2. ACTIVE PAID SUBSCRIPTION
    // -------------------------------
    if (
      user.isSubscribed &&
      user.subscriptionEndDate &&
      user.subscriptionEndDate > now
    ) {
      const daysRemaining = Math.ceil(
        (user.subscriptionEndDate.getTime() - now.getTime()) /
          (1000 * 60 * 60 * 24),
      );

      return {
        planType: 'PAID',
        status: 'active',
        startDate: user.subscriptionStartDate,
        endDate: user.subscriptionEndDate,
        nextBillingDate: user.nextSubscriptionBillingDate,
        daysRemaining,
        message: 'Paid subscription is active',
      };
    }

    // -------------------------------
    // 3. EXPIRED (Trial / Paid)
    // -------------------------------
    return {
      planType: 'NONE',
      status: 'expired',
      message: 'No active plan. Subscription required.',
    };
  }

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

    // Create GarageSubscription for trial
    await this.prisma.garageSubscription.create({
      data: {
        userId,
        type: 'TRIAL',
        startDate: now,
        endDate: trialEnd,
        status: 'ACTIVE',
      },
    });

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

  // Create monthly subscription session ($100)
  async createMonthlySubscriptionSession(
    userId: string,
  ): Promise<{ url: string }> {
    return this.paymentService.createMonthlyPlanSession(userId);
  }

  // Get garage subscription history for a user
  async getSubscriptionHistory(userId: string): Promise<any[]> {
    const subscriptions = await this.prisma.garageSubscription.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: { payment: true },
    });

    return subscriptions.map((sub, index) => {
      const isTrial = sub.type === 'TRIAL';
      const payment = sub.payment[0];

      // const transactionId = `TXN${String(subscriptions.length - index).padStart(3, '0')}`;
      const transactionId = payment?.transactionId ? payment.transactionId : '';

      return {
        transactionId,
        date: new Date(sub.startDate).toLocaleDateString('en-GB', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        }),
        description: isTrial
          ? '3-Month Free Trial Started'
          : 'Monthly Subscription',
        paymentMethod: payment?.paymentMethod
          ? payment.paymentMethod.charAt(0).toUpperCase() +
            payment.paymentMethod.slice(1)
          : '-',
        amount: isTrial ? 'Free' : sub.amount! / 100,
        currency: isTrial ? null : sub.currency?.toUpperCase(),
        status: 'Paid',
      };
    });
  }

  // Cancel subscription for user model with isSubscribed & isSubscriptionTrialActive set to false
  async cancelSubscription(userId: string): Promise<any> {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        isSubscribed: false,
        isSubscriptionTrialActive: false,
      },
    });
  }
}
