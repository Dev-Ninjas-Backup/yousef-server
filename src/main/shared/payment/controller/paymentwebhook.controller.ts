import 'dotenv/config';
import {
  Controller,
  Headers,
  Post,
  Req,
  Res,
  HttpStatus,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from 'src/lib/prisma/prisma.service';
import { MailService } from 'src/lib/mail/mail.service';
import Stripe from 'stripe';
import { PaymentStatus } from '@prisma/client';

console.log(process.env.STRIPE_SECRET_KEY);

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {});

@Controller('stripe')
export class PaymentWebhookController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
  ) {}

  @Post('webhook')
  async handleWebhook(
    @Req() req,
    @Res() res,
    @Headers('stripe-signature') signature: string,
  ) {
    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET as string,
      );
    } catch (err) {
      console.error('Invalid webhook signature:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    const isCheckoutCompleted = event.type === 'checkout.session.completed';
    const isPaymentFailed = [
      'payment_intent.payment_failed',
      'invoice.payment_failed',
      'checkout.session.async_payment_failed',
    ].includes(event.type);

    try {
      if (isCheckoutCompleted) {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;
        const planId = session.metadata?.planId;

        if (!userId || !planId)
          return res.status(400).send('Missing userId or planId in metadata');

        // Map Stripe status to enum
        const statusMap = {
          paid: PaymentStatus.COMPLETED,
          unpaid: PaymentStatus.PENDING,
          no_payment_required: PaymentStatus.COMPLETED,
        };
        const status =
          statusMap[session.payment_status as keyof typeof statusMap] ||
          PaymentStatus.PENDING;

        // Save payment record
        const paymentRecord = await this.prisma.payment.create({
          data: {
            userId,
            planId,
            sessionId: session.id,
            transactionId: session.payment_intent as string,
            amount: session.amount_total,
            currency: session.currency || 'usd',
            status,
            paymentMethod: session.payment_method_types?.[0] ?? 'unknown',
          },
        });

        // ------------Fetch plan to determine subscription length-----------------
        const plan = await this.prisma.paymentplan.findUnique({
          where: { id: planId },
        });
        if (!plan) throw new InternalServerErrorException('Plan not found');

        const subscriptionDays =
          plan.billingCycle === 'MONTHLY'
            ? 30
            : plan.billingCycle === 'YEARLY'
              ? 360
              : 0;

        // -------------Update user subscription------------
        await this.prisma.user.update({
          where: { id: userId },
          data: {
            role: 'MEMBER',
            isMembership: true,
            subscriptionEndsAt: new Date(
              Date.now() + subscriptionDays * 24 * 60 * 60 * 1000,
            ),
          },
        });

        // Send confirmation email
        const user = await this.prisma.user.findUnique({
          where: { id: userId },
        });
        if (user?.email && paymentRecord.amount) {
          const message = `
            Payment Successful!
            Plan: ${plan.name}
            Amount: $${(paymentRecord.amount / 100).toFixed(2)} ${paymentRecord.currency.toUpperCase()}
            Transaction ID: ${paymentRecord.transactionId}
            Status: ${paymentRecord.status}
            Subscription Ends At: ${new Date(Date.now() + subscriptionDays * 24 * 60 * 60 * 1000)}
          `;
          await this.mailService.sendEmail(
            user.email,
            'Payment Confirmation',
            message,
          );
        }
      }

      if (isPaymentFailed) {
        const dataObject: any = event.data.object;
        const userId = dataObject.metadata?.userId;
        const planId = dataObject.metadata?.planId;

        if (userId && planId) {
          await this.prisma.payment.create({
            data: {
              userId,
              planId,
              sessionId: dataObject.id,
              transactionId: dataObject.payment_intent || '',
              amount: dataObject.amount || 0,
              currency: dataObject.currency || 'usd',
              status: PaymentStatus.CANCELLED,
              paymentMethod: dataObject.payment_method_types?.[0] ?? 'unknown',
            },
          });

          const user = await this.prisma.user.findUnique({
            where: { id: userId },
          });
          if (user?.email) {
            const message = `
              Payment Failed.
              Plan ID: ${planId}
              Reason: ${dataObject.last_payment_error?.message || 'Unknown'}
            `;
            await this.mailService.sendEmail(
              user.email,
              'Payment Failed',
              message,
            );
          }
        }
      }

      return res.status(HttpStatus.OK).json({ received: true });
    } catch (err) {
      console.error('Webhook handling error:', err);
      return res.status(500).send('Internal server error');
    }
  }
}
