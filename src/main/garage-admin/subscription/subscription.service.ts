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
      const daysRemaining = Math.max(
        0,
        Math.ceil(
          (user.subscriptionTrialEndDate.getTime() - now.getTime()) /
            (1000 * 60 * 60 * 24),
        ),
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
      const daysRemaining = Math.max(
        0,
        Math.ceil(
          (user.subscriptionEndDate.getTime() - now.getTime()) /
            (1000 * 60 * 60 * 24),
        ),
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

  // Create monthly subscription session ($100)
  async createMonthlySubscriptionSession(
    userId: string,
  ): Promise<{ url: string }> {
    return this.paymentService.createMonthlyPlanSession(userId);
  }

  // Get garage subscription history for a user
  async getSubscriptionHistory(userId: string) {
    const subscriptions = await this.prisma.payment.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
            profilePhoto: true,
          },
        },
      },
      omit: {
        id: true,
        updatedAt: true,
        planId: true,
        garageSubscriptionId: true,
        productId: true,
      },
    });

    return subscriptions;

    // {
    //   id: 'eeb5f64b-a2d9-4bd7-9a08-2b7a35333df4',
    //     sessionId: 'cs_test_a1dzxibYUeir9qfQ4aeNNFqpUWXyVEQhBU1KGdBPTmUlVYjCn4LLK6sZCt',
    //       transactionId: 'pi_3SZgqQP3Cjs6shL61Bh9IYw8',
    //         amount: 10000,
    //           currency: 'usd',
    //             status: 'COMPLETED',
    //               paymentMethod: 'card',
    //                 paymentType: 'GARAGE_SUBSCRIPTION',
    //                   createdAt: 2025 - 12-01T23: 49: 26.268Z,
    //                     updatedAt: 2025 - 12-01T23: 49: 26.268Z,
    //                       userId: 'a733dc9b-4916-4047-9492-2366c93857c7',
    //                         planId: null,
    //                           garageSubscriptionId: 'b900ba90-84b8-4c2c-8265-34b63fe500fc',
    //                             productId: null
    // },

    // return subscriptions.map((sub, index) => {
    //   const isTrial = sub.type === 'TRIAL';
    //   const payment = sub.payment[0];

    //   const transactionId = payment?.transactionId ? payment.transactionId : '';

    //   return {
    //     transactionId,
    //     date: new Date(sub.createdAt).toLocaleDateString('en-GB', {
    //       day: 'numeric',
    //       month: 'long',
    //       year: 'numeric',
    //     }),
    //     description: isTrial
    //       ? '3-Month Free Trial Started'
    //       : 'Monthly Subscription',
    //     paymentMethod: payment?.paymentMethod
    //       ? payment.paymentMethod.charAt(0).toUpperCase() +
    //       payment.paymentMethod.slice(1)
    //       : '-',
    //     amount: isTrial ? 'Free' : sub.amount! / 100,
    //     currency: isTrial ? null : sub.currency?.toUpperCase(),
    //     status: 'Paid',
    //   };
    // });
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
