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

    // 5. Send listing expiry reminders
    this.logger.log('Checking for product listings nearing expiration...');

    // Helper to get start and end range for dates days ahead
    const getTargetRange = (daysAhead: number) => {
      const start = new Date();
      start.setDate(start.getDate() + daysAhead);
      start.setHours(0, 0, 0, 0);

      const end = new Date();
      end.setDate(end.getDate() + daysAhead);
      end.setHours(23, 59, 59, 999);

      return { gte: start, lte: end };
    };

    const sendExpiryReminder = async (product: any, daysRemaining: number) => {
      if (!product.createdBy?.email) return;

      // Check if user has email notification enabled
      if (product.createdBy.isEmailNotification === false) {
        this.logger.log(
          `User ${product.createdBy.email} has disabled email notifications. Skipping reminder.`,
        );
        return;
      }
      const message = `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #f0f0f0; border-radius: 8px; overflow: hidden;">
          <div style="background-color: #0066FF; padding: 20px; text-align: center;">
            <h1 style="color: #fff; margin: 0; font-size: 20px;">Spare Part Listing Expiring Soon</h1>
          </div>
          <div style="padding: 20px;">
            <p>Hello,</p>
            <p>This is a reminder that your spare part listing for <strong>"${product.partName}"</strong> is expiring in <strong>${daysRemaining} day(s)</strong>.</p>
            <div style="background-color: #f9f9f9; padding: 15px; border-radius: 6px; margin: 20px 0;">
              <p style="margin: 0 0 8px 0;"><strong>Product details:</strong></p>
              <ul style="margin: 0; padding-left: 20px;">
                <li><strong>Brand:</strong> ${product.brand || 'N/A'}</li>
                <li><strong>Price:</strong> ${product.price} AED</li>
                <li><strong>Plan Type:</strong> ${product.listingPlan || 'Free Plan'}</li>
                <li><strong>Expiration Date:</strong> ${new Date(product.expiresAt).toLocaleDateString()}</li>
              </ul>
            </div>
            <p>Once expired, your product will be hidden from search results and the marketplace. To keep it visible or list more items, please manage your subscription plan.</p>
            <div style="text-align: center; margin: 25px 0;">
              <a href="${process.env.FRONTEND_URL || 'https://sayarahub.ae'}/user/dashboard" style="background-color: #0066FF; color: #fff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: bold; display: inline-block;">Manage Subscription Plan</a>
            </div>
            <p style="font-size: 12px; color: #777;">If you have already renewed or taken action, please ignore this email.</p>
          </div>
        </div>
      `;

      try {
        await this.mailService.sendEmail(
          product.createdBy.email,
          `Listing Expiry Warning: "${product.partName}" expires in ${daysRemaining} day(s)`,
          message,
        );
        this.logger.log(
          `Sent ${daysRemaining}-day expiry reminder for product "${product.partName}" to ${product.createdBy.email}`,
        );
      } catch (err) {
        this.logger.error(
          `Failed to send expiry email for product "${product.partName}" to ${product.createdBy.email}`,
          err,
        );
      }
    };

    // - 10 Days Reminder (only for MONTHLY_PRO)
    const proTenDaysRange = getTargetRange(10);
    const proTenDaysProducts = await this.prisma.product.findMany({
      where: {
        status: 'APPROVED',
        listingPlan: 'MONTHLY_PRO',
        expiresAt: proTenDaysRange,
      },
      include: {
        createdBy: true,
      },
    });
    for (const p of proTenDaysProducts) {
      await sendExpiryReminder(p, 10);
    }

    // - 5 Days Reminder (only for Non-PRO, e.g. Free, Basic, Pay-per-listing)
    const nonProFiveDaysRange = getTargetRange(5);
    const nonProFiveDaysProducts = await this.prisma.product.findMany({
      where: {
        status: 'APPROVED',
        NOT: {
          listingPlan: 'MONTHLY_PRO',
        },
        expiresAt: nonProFiveDaysRange,
      },
      include: {
        createdBy: true,
      },
    });
    for (const p of nonProFiveDaysProducts) {
      await sendExpiryReminder(p, 5);
    }

    // - 3 Days Reminder (for ALL active products)
    const threeDaysRange = getTargetRange(3);
    const threeDaysProducts = await this.prisma.product.findMany({
      where: {
        status: 'APPROVED',
        expiresAt: threeDaysRange,
      },
      include: {
        createdBy: true,
      },
    });
    for (const p of threeDaysProducts) {
      await sendExpiryReminder(p, 3);
    }

    // - 1 Day Reminder (for ALL active products)
    const oneDayRange = getTargetRange(1);
    const oneDayProducts = await this.prisma.product.findMany({
      where: {
        status: 'APPROVED',
        expiresAt: oneDayRange,
      },
      include: {
        createdBy: true,
      },
    });
    for (const p of oneDayProducts) {
      await sendExpiryReminder(p, 1);
    }

    this.logger.log(`Processed subscriptions and listing reminders check.`);
  }
}
