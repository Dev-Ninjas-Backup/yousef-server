import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { MailService } from 'src/lib/mail/mail.service';
import { PrismaService } from 'src/lib/prisma/prisma.service';

@Injectable()
export class ScheduleService {
  private readonly logger = new Logger(ScheduleService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleExpiration() {
    this.logger.log('Checking for expired subscription cycles...');

    const now = new Date();

    // 1. Find all MEMBERS whose subscription has ended
    const expiredMembers = await this.prisma.user.findMany({
      where: {
        role: 'MEMBER',
        subscriptionEndsAt: { lte: now },
      },
    });

    for (const user of expiredMembers) {
      // Downgrade user to normal USER
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          role: 'CAR_OWNER',
          isMembership: false,
          subscriptionEndsAt: null,
        },
      });

      // Send email notification
      if (user.email) {
        const text = `Hello ${user.email}, your premium membership has ended. Your account is now USER. Upgrade anytime to regain full access.`;
        const message = `
          <h1>Your Premium Access Has Ended</h1>
          <p>Hello ${user.email},</p>
          <p>Your premium membership has ended and your account is now USER.</p>
          <p>Upgrade your plan anytime to regain full access.</p>
        `;
        try {
          await this.mailService.sendEmail(user.email, text, message);
          this.logger.log(`MEMBER → USER email sent to ${user.email}`);
        } catch (err) {
          this.logger.error(
            `Failed to send premium expiry email to ${user.email}`,
            err,
          );
        }
      }
    }

    // 2. Find all users whose product monthly plan has ended
    const expiredProductMonthly = await this.prisma.user.findMany({
      where: {
        productMonthlyActive: true,
        productMonthlyEndDate: { lte: now },
      },
    });

    for (const user of expiredProductMonthly) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          productMonthlyActive: false,
          productMonthlyPendingPlanType: null,
          productMonthlyCancelAtPeriodEnd: false,
        },
      });
      this.logger.log(
        `Product monthly plan expired for user ${user.email || user.id}`,
      );
    }

    // 3. Find all users whose garage subscription has ended
    const expiredGarageSubscriptions = await this.prisma.user.findMany({
      where: {
        isSubscribed: true,
        subscriptionEndDate: { lte: now },
      },
    });

    for (const user of expiredGarageSubscriptions) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          isSubscribed: false,
          subscriptionCancelAtPeriodEnd: false,
          garageStatus: 'APPROVE',
        },
      });
      this.logger.log(
        `Garage subscription expired for user ${user.email || user.id}`,
      );
    }

    // 4. Find all products whose promotion has expired
    const expiredPromotions = await this.prisma.product.findMany({
      where: {
        isPromoted: true,
        promotedUntil: { lte: now },
      },
    });

    for (const product of expiredPromotions) {
      await this.prisma.product.update({
        where: { id: product.id },
        data: {
          isPromoted: false,
          promotedUntil: null,
        },
      });
      this.logger.log(
        `Product promotion expired for product ${product.partName || product.id}`,
      );
    }

    this.logger.log(`Processed subscriptions check.`);
  }
}
