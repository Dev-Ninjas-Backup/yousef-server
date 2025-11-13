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
    this.logger.log('Checking for expired MEMBER users...');

    const now = new Date();

    // Find all MEMBERS whose subscription has ended
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
          role: 'USER',
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
          await this.mailService.sendEmail(
            user.email,
            'Your Premium Access Has Ended',
            message,
          );
          this.logger.log(`MEMBER → USER email sent to ${user.email}`);
        } catch (err) {
          this.logger.error(
            `Failed to send premium expiry email to ${user.email}`,
            err,
          );
        }
      }
    }

    this.logger.log(
      `Processed ${expiredMembers.length} expired premium members.`,
    );
  }
}
