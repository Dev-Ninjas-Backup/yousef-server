import { Injectable, NotFoundException } from '@nestjs/common';
import { AppError } from 'src/common/error/handle-error.app';
import { PrismaService } from 'src/lib/prisma/prisma.service';
import { PaymentService } from 'src/main/shared/payment/service/payment.service';

@Injectable()
export class SubscriptionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly paymentService: PaymentService,
  ) {}

  async getFirstGarageId(userId: string): Promise<string | undefined> {
    const firstGarage = await this.prisma.garage.findFirst({
      where: { userId },
      orderBy: { createdAt: 'asc' },
      select: { id: true },
    });
    return firstGarage?.id;
  }

  async getCurrentPlan(userId: string, garageId?: string) {
    const targetGarageId = garageId || (await this.getFirstGarageId(userId));

    if (!targetGarageId) {
      return {
        planType: 'NONE',
        status: 'expired',
        message: 'No garage found. Please create a garage first.',
        subscriptionCancelAtPeriodEnd: false,
        productMonthlyPendingPlanType: null,
        productMonthlyCancelAtPeriodEnd: false,
      };
    }

    const firstGarage = await this.prisma.garage.findFirst({
      where: { userId },
      orderBy: { createdAt: 'asc' },
      select: { id: true },
    });

    const isFirstGarage = targetGarageId === firstGarage?.id;

    // Fetch user and target garage info
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
        subscriptionCancelAtPeriodEnd: true,
        productMonthlyPendingPlanType: true,
        productMonthlyCancelAtPeriodEnd: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const garageObj = await this.prisma.garage.findUnique({
      where: { id: targetGarageId },
      select: {
        subscriptionTrialStartDate: true,
        subscriptionTrialEndDate: true,
        isSubscriptionTrialActive: true,
        isSubscribed: true,
        subscriptionStartDate: true,
        subscriptionEndDate: true,
        nextSubscriptionBillingDate: true,
        subscriptionCancelAtPeriodEnd: true,
        subscriptionEndsAt: true,
      },
    });

    if (!garageObj) {
      throw new NotFoundException('Garage not found');
    }

    const now = new Date();

    // Determine subSource: if first garage, we can fall back to user-level sub if it is active.
    let subSource: {
      subscriptionTrialStartDate: Date | null;
      subscriptionTrialEndDate: Date | null;
      isSubscriptionTrialActive: boolean;
      isSubscribed: boolean;
      subscriptionStartDate: Date | null;
      subscriptionEndDate: Date | null;
      nextSubscriptionBillingDate: Date | null;
      subscriptionCancelAtPeriodEnd: boolean;
      subscriptionEndsAt?: Date | null;
    };

    if (isFirstGarage) {
      const isUserActive =
        (user.isSubscribed &&
          user.subscriptionEndDate &&
          new Date(user.subscriptionEndDate) > now) ||
        (user.isSubscriptionTrialActive &&
          user.subscriptionTrialEndDate &&
          new Date(user.subscriptionTrialEndDate) > now);

      const isGarageActive =
        (garageObj.isSubscribed &&
          garageObj.subscriptionEndDate &&
          new Date(garageObj.subscriptionEndDate) > now) ||
        (garageObj.isSubscriptionTrialActive &&
          garageObj.subscriptionTrialEndDate &&
          new Date(garageObj.subscriptionTrialEndDate) > now) ||
        (garageObj.subscriptionEndsAt &&
          new Date(garageObj.subscriptionEndsAt) > now);

      if (isUserActive || !isGarageActive) {
        subSource = {
          subscriptionTrialStartDate: user.subscriptionTrialStartDate,
          subscriptionTrialEndDate: user.subscriptionTrialEndDate,
          isSubscriptionTrialActive: user.isSubscriptionTrialActive,
          isSubscribed: user.isSubscribed,
          subscriptionStartDate: user.subscriptionStartDate,
          subscriptionEndDate: user.subscriptionEndDate,
          nextSubscriptionBillingDate: user.nextSubscriptionBillingDate,
          subscriptionCancelAtPeriodEnd: user.subscriptionCancelAtPeriodEnd,
        };
      } else {
        subSource = {
          subscriptionTrialStartDate: garageObj.subscriptionTrialStartDate,
          subscriptionTrialEndDate: garageObj.subscriptionTrialEndDate,
          isSubscriptionTrialActive: garageObj.isSubscriptionTrialActive,
          isSubscribed: garageObj.isSubscribed,
          subscriptionStartDate: garageObj.subscriptionStartDate,
          subscriptionEndDate: garageObj.subscriptionEndDate,
          nextSubscriptionBillingDate: garageObj.nextSubscriptionBillingDate,
          subscriptionCancelAtPeriodEnd:
            garageObj.subscriptionCancelAtPeriodEnd,
          subscriptionEndsAt: garageObj.subscriptionEndsAt,
        };
      }
    } else {
      subSource = {
        subscriptionTrialStartDate: garageObj.subscriptionTrialStartDate,
        subscriptionTrialEndDate: garageObj.subscriptionTrialEndDate,
        isSubscriptionTrialActive: garageObj.isSubscriptionTrialActive,
        isSubscribed: garageObj.isSubscribed,
        subscriptionStartDate: garageObj.subscriptionStartDate,
        subscriptionEndDate: garageObj.subscriptionEndDate,
        nextSubscriptionBillingDate: garageObj.nextSubscriptionBillingDate,
        subscriptionCancelAtPeriodEnd: garageObj.subscriptionCancelAtPeriodEnd,
        subscriptionEndsAt: garageObj.subscriptionEndsAt,
      };
    }

    // -------------------------------
    // 1. ACTIVE TRIAL
    // -------------------------------
    if (
      subSource.isSubscriptionTrialActive &&
      subSource.subscriptionTrialEndDate &&
      new Date(subSource.subscriptionTrialEndDate) > now
    ) {
      const daysRemaining = Math.max(
        0,
        Math.ceil(
          (new Date(subSource.subscriptionTrialEndDate).getTime() -
            now.getTime()) /
            (1000 * 60 * 60 * 24),
        ),
      );

      return {
        planType: 'TRIAL',
        status: 'active',
        startDate: subSource.subscriptionTrialStartDate,
        endDate: subSource.subscriptionTrialEndDate,
        daysRemaining,
        message: 'Free trial is currently active',
        subscriptionCancelAtPeriodEnd: subSource.subscriptionCancelAtPeriodEnd,
        productMonthlyPendingPlanType: user.productMonthlyPendingPlanType,
        productMonthlyCancelAtPeriodEnd: user.productMonthlyCancelAtPeriodEnd,
      };
    }

    // -------------------------------
    // 2. ACTIVE PAID SUBSCRIPTION
    // -------------------------------
    const isPaidActive =
      (subSource.isSubscribed &&
        subSource.subscriptionEndDate &&
        new Date(subSource.subscriptionEndDate) > now) ||
      (subSource.subscriptionEndsAt &&
        new Date(subSource.subscriptionEndsAt) > now);

    const activeEndDate =
      subSource.subscriptionEndDate || subSource.subscriptionEndsAt;

    if (isPaidActive && activeEndDate) {
      const daysRemaining = Math.max(
        0,
        Math.ceil(
          (new Date(activeEndDate).getTime() - now.getTime()) /
            (1000 * 60 * 60 * 24),
        ),
      );

      return {
        planType: 'PAID',
        status: 'active',
        startDate:
          subSource.subscriptionStartDate ||
          subSource.subscriptionTrialStartDate,
        endDate: activeEndDate,
        nextBillingDate: subSource.nextSubscriptionBillingDate || activeEndDate,
        daysRemaining,
        message: 'Paid subscription is active',
        subscriptionCancelAtPeriodEnd: subSource.subscriptionCancelAtPeriodEnd,
        productMonthlyPendingPlanType: user.productMonthlyPendingPlanType,
        productMonthlyCancelAtPeriodEnd: user.productMonthlyCancelAtPeriodEnd,
      };
    }

    // -------------------------------
    // 3. EXPIRED (Trial / Paid)
    // -------------------------------
    return {
      planType: 'NONE',
      status: 'expired',
      message: 'No active plan. Subscription required.',
      subscriptionCancelAtPeriodEnd:
        subSource.subscriptionCancelAtPeriodEnd ?? false,
      productMonthlyPendingPlanType: user.productMonthlyPendingPlanType ?? null,
      productMonthlyCancelAtPeriodEnd:
        user.productMonthlyCancelAtPeriodEnd ?? false,
    };
  }

  // Create monthly subscription session ($100)
  async createMonthlySubscriptionSession(
    userId: string,
    garageId?: string,
  ): Promise<{ url: string }> {
    return this.paymentService.createMonthlyPlanSession(userId, garageId);
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

  async cancelSubscription(userId: string, garageId?: string): Promise<any> {
    const targetGarageId = garageId || (await this.getFirstGarageId(userId));

    if (!targetGarageId) {
      throw new AppError(404, 'No garage found to cancel subscription for.');
    }

    const garage = await this.prisma.garage.findUnique({
      where: { id: targetGarageId },
    });

    if (!garage || garage.userId !== userId) {
      throw new AppError(404, 'Garage not found or does not belong to you.');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new AppError(404, 'User not found');
    }

    const firstGarage = await this.prisma.garage.findFirst({
      where: { userId },
      orderBy: { createdAt: 'asc' },
      select: { id: true },
    });

    const isFirstGarage = targetGarageId === firstGarage?.id;

    // Check subscription status
    const isGarageActive =
      garage.isSubscribed ||
      garage.isSubscriptionTrialActive ||
      (isFirstGarage && (user.isSubscribed || user.isSubscriptionTrialActive));

    if (!isGarageActive) {
      throw new AppError(400, 'No active subscription found for this garage');
    }

    // Cancel on Garage model
    await this.prisma.garage.update({
      where: { id: targetGarageId },
      data: {
        subscriptionCancelAtPeriodEnd: true,
      },
    });

    // If first garage, also cancel on User model
    if (isFirstGarage) {
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          subscriptionCancelAtPeriodEnd: true,
        },
      });
    }

    return {
      message: 'Subscription will be cancelled at the end of current period',
      data: null,
    };
  }

  async downgradeProductPlan(userId: string, planType: string): Promise<any> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new AppError(404, 'User not found');
    }

    if (!user.productMonthlyActive) {
      throw new AppError(
        400,
        'No active product monthly plan found to downgrade',
      );
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        productMonthlyPendingPlanType: planType,
      },
    });

    return {
      message: `Plan will be downgraded to ${planType} on renewal`,
      data: null,
    };
  }

  async cancelProductMonthly(userId: string): Promise<any> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new AppError(404, 'User not found');
    }

    if (!user.productMonthlyActive) {
      throw new AppError(400, 'No active product monthly plan found');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        productMonthlyCancelAtPeriodEnd: true,
      },
    });

    return {
      message:
        'Product monthly subscription will be cancelled at the end of period',
      data: null,
    };
  }
}
