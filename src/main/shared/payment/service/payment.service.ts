import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';

import { PaymentStatus, UserRole } from '@prisma/client';
import { HandleError } from 'src/common/error/handle-error.decorator';
import { MailService } from 'src/lib/mail/mail.service';
import { PrismaService } from 'src/lib/prisma/prisma.service';
import Stripe from 'stripe';
import { CreateCheckoutPlanDto } from '../dto/checkout-plan.dto';
import { NotificationGateway } from 'src/lib/notificaton/notification.gateway';
@Injectable()
export class PaymentService {
  private stripe: Stripe;

  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
    private readonly notificationGateway: NotificationGateway,
  ) {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {});
  }

  // ---------------- create payment ----------------

  @HandleError('Failed to create payment')
  async createCheckoutSession(
    userId: string,
    payload: CreateCheckoutPlanDto,
  ): Promise<{ url: string }> {
    // 1. Find plan from DB
    const plan = await this.prisma.paymentPlan.findUnique({
      where: { id: payload.planId },
    });

    if (!plan) throw new NotFoundException('Payment plan not found...');

    // 2. Create Stripe checkout session
    const session = await this.stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: plan.name || 'Payment Plan',
              description: plan.shortBio ?? '',
              metadata: {
                billingCycle: plan.billingCycle,
                features: plan.features.join(','),
              },
            },
            unit_amount: plan.Price * 100,
          },
          quantity: 1,
        },
      ],
      success_url: `${process.env.FRONTEND_URL}/success-payment`,
      cancel_url: `${process.env.FRONTEND_URL}/cancel-payment`,
      metadata: { userId, planId: plan.id },
    });

    return { url: session.url! };
  }

  @HandleError('Failed to fetch user payments')
  async findmyPayment(userId: string) {
    return this.prisma.payment.findMany({
      where: {
        userId,
        status: PaymentStatus.COMPLETED,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Get payments for specific product
  @HandleError('Failed to fetch product payments')
  async getProductPayments(productId: string, userId: string) {
    // Verify product belongs to user
    const product = await this.prisma.product.findFirst({
      where: { id: productId, sellerId: userId },
    });

    if (!product)
      throw new NotFoundException('Product not found or access denied');

    return this.prisma.payment.findMany({
      where: {
        userId,
        status: PaymentStatus.COMPLETED,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ------------------- Admin only -------------------
  @HandleError('Failed to fetch all payments')
  async findAllPayments(): Promise<any[]> {
    const payments = await this.prisma.payment.findMany({
      where: {
        status: PaymentStatus.COMPLETED,
      },
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            profilePhoto: true,
            email: true,
            garageName: true,
          },
        },
      },
    });

    return payments;
  }

  // Check if user can create free product
  @HandleError('Failed to check product limit')
  async canCreateFreeProduct(userId: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { freeProductsUsed: true },
    });

    if (!user) throw new NotFoundException('User not found');

    const paymentConfig = await this.prisma.paymentConfigure.findFirst();

    if (!paymentConfig) {
      throw new InternalServerErrorException(
        'Platform payment configuration missing!',
      );
    }

    const freePromotionalListings = Number(
      paymentConfig?.freePromotionalListings || 0,
    );

    return user.freeProductsUsed < freePromotionalListings;
  }

  // Handle webhook events
  @HandleError('Failed to handle webhook')
  async handleWebhook(signature: string, body: Buffer): Promise<void> {
    console.log('🔥 PaymentService.handleWebhook called');
    console.log('Signature:', signature);
    console.log('Body length:', body?.length);
    console.log(
      'Webhook Secret:',
      process.env.STRIPE_WEBHOOK_SECRET?.substring(0, 10) + '...',
    );

    let event: Stripe.Event;

    try {
      event = this.stripe.webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET!,
      );
      console.log('✅ Webhook signature verified successfully');
    } catch (err) {
      console.error('❌ Webhook signature verification failed:', err.message);
      throw new BadRequestException(
        `Webhook signature verification failed: ${err.message}`,
      );
    }

    switch (event.type) {
      case 'checkout.session.completed':
        console.log('💰 Processing checkout.session.completed');
        await this.handleCheckoutSuccess(
          event.data.object as Stripe.Checkout.Session,
        );
        break;
      case 'payment_intent.payment_failed':
        console.log('❌ Processing payment_intent.payment_failed');
        await this.handlePaymentFailed(
          event.data.object as Stripe.PaymentIntent,
        );
        break;
      default:
        console.log(`⚠️ Unhandled event type: ${event.type}`);
    }
  }

  private async handleCheckoutSuccess(
    session: Stripe.Checkout.Session,
  ): Promise<void> {
    console.log('🔥 Webhook received - handleCheckoutSuccess');
    console.log('Session metadata:', session.metadata);

    const { userId, type, productId, productName, amount } = session.metadata!;

    if (type === 'monthly_subscription') {
      console.log('💰 Processing monthly subscription for user:', userId);
      const now = new Date();
      const subscriptionEndDate = new Date(now);
      subscriptionEndDate.setDate(subscriptionEndDate.getDate() + 30); // Strictly 30 days subscription

      // Create GarageSubscription record
      const garageSub = await this.prisma.garageSubscription.create({
        data: {
          userId,
          type: 'PAID',
          amount: parseInt(amount) * 100,
          currency: 'usd',
          stripeSessionId: session.id,
          stripePaymentId: session.payment_intent as string,
          startDate: now,
          endDate: subscriptionEndDate,
          billingCycle: 'MONTHLY',
          status: 'ACTIVE',
        },
      });

      // Create payment record
      await this.prisma.payment.create({
        data: {
          sessionId: session.id,
          transactionId: session.payment_intent as string,
          amount: parseInt(amount) * 100,
          currency: 'usd',
          status: 'COMPLETED',
          paymentMethod: 'card',
          paymentType: 'GARAGE_SUBSCRIPTION',
          userId,
          garageSubscriptionId: garageSub.id,
        },
      });

      // Update user's subscription status with new columns
      const updatedUser = await this.prisma.user.update({
        where: { id: userId },
        data: {
          isSubscribed: true,
          subscriptionStartDate: now,
          subscriptionEndDate: subscriptionEndDate,
          nextSubscriptionBillingDate: subscriptionEndDate,
          garageStatus: 'GARAGE_PAID_OWNER',
          isSubscriptionTrialActive: false, // End trial if active
        },
      });
      console.log(
        '✅ User subscription activated:',
        updatedUser.isSubscribed,
        updatedUser.subscriptionEndDate,
      );

      try {
        const notif = await this.prisma.notification.create({
          data: {
            title: 'Subscription Updated',
            message: `Your subscription has been updated to Garage Partner (${amount} AED/month).`,
            type: 'ProductApproveUpdate',
            meta: {
              planName: 'Garage / Business Plan',
              price: `${amount} AED`,
              effectiveDate: now.toLocaleDateString('en-GB', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              }),
            },
          },
        });
        await this.prisma.userNotification.create({
          data: {
            userId,
            notificationId: notif.id,
          },
        });
        await this.notificationGateway.notifySingleUser(
          userId,
          'product-approve-update',
          {
            title: notif.title,
            message: notif.message,
            meta: notif.meta,
          },
        );
      } catch (err) {
        console.error(
          'Failed to send real-time notification for monthly_subscription:',
          err,
        );
      }

      const notification = await this.prisma.garageAdminNotification.findUnique(
        {
          where: {
            userId: userId,
          },
        },
      );

      console.log('Email Notification: ', notification?.emailNotification);

      // Send email notification
      try {
        if (notification?.emailNotification) {
          await this.mailService.sendPaymentConfirmationEmail(
            updatedUser.email,
            {
              userName: updatedUser.fullName || 'Valued Customer',
              paymentType: 'garage_monthly',
              amount: parseInt(amount) * 100,
              transactionId: session.payment_intent as string,
              garageName: updatedUser.garageName as string,
              startDate: now,
              endDate: subscriptionEndDate,
            },
          );
        }
      } catch (emailError) {
        console.error('Failed to send email:', emailError);
      }
    } else if (type === 'pay_per_product') {
      console.log('💳 Processing pay-per product for user:', userId);
      // Create payment record for pay-per product
      await this.prisma.payment.create({
        data: {
          sessionId: session.id,
          transactionId: session.payment_intent as string,
          amount: parseInt(amount) * 100,
          currency: 'usd',
          status: 'COMPLETED',
          paymentMethod: 'card',
          paymentType: 'PAY_PER_PRODUCT',
          userId,
        },
      });

      // Give user 1 product creation credit
      const updatedUser = await this.prisma.user.update({
        where: { id: userId },
        data: {
          hasPaid: true,
          // Add 1 to available product credits (we'll track this)
          freeProductsListing: {
            increment: 1,
          },
        },
      });
      console.log(
        '✅ User updated with credit:',
        updatedUser.freeProductsListing,
      );

      try {
        const notif = await this.prisma.notification.create({
          data: {
            title: 'Listing Credit Purchased',
            message: `Your subscription has been updated to Pay Per Listing (${amount} AED/listing).`,
            type: 'ProductApproveUpdate',
            meta: {
              planName: 'Pay Per Listing Plan',
              price: `${amount} AED`,
              effectiveDate: new Date().toLocaleDateString('en-GB', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              }),
            },
          },
        });
        await this.prisma.userNotification.create({
          data: {
            userId,
            notificationId: notif.id,
          },
        });
        await this.notificationGateway.notifySingleUser(
          userId,
          'product-approve-update',
          {
            title: notif.title,
            message: notif.message,
            meta: notif.meta,
          },
        );
      } catch (err) {
        console.error(
          'Failed to send real-time notification for pay_per_product:',
          err,
        );
      }

      const notification = await this.prisma.garageAdminNotification.findUnique(
        {
          where: {
            userId: userId,
          },
        },
      );

      // Send email notification
      try {
        if (
          updatedUser?.role === UserRole.GARAGE_OWNER &&
          notification?.emailNotification
        ) {
          await this.mailService.sendPaymentConfirmationEmail(
            updatedUser.email,
            {
              userName: updatedUser.fullName || 'Valued Customer',
              paymentType: 'pay_per_product',
              amount: parseInt(amount) * 100,
              transactionId: session.payment_intent as string,
            },
          );
        } else if (updatedUser?.isEmailNotification) {
          await this.mailService.sendPaymentConfirmationEmail(
            updatedUser.email,
            {
              userName: updatedUser.fullName || 'Valued Customer',
              paymentType: 'pay_per_product',
              amount: parseInt(amount) * 100,
              transactionId: session.payment_intent as string,
            },
          );
        }
      } catch (emailError) {
        console.error('Failed to send email:', emailError);
      }
    } else if (type === 'product_monthly_subscription') {
      console.log('Processing PRODUCT MONTHLY subscription for user:', userId);

      const planNameParam = session.metadata?.planType || 'PRO';
      const daysToAdd = planNameParam.toUpperCase() === 'BASIC' ? 60 : 30;

      const now = new Date();
      const endDate = new Date(now);
      endDate.setDate(endDate.getDate() + daysToAdd); // Dynamically set 30 or 60 days subscription

      // Payment record
      await this.prisma.payment.create({
        data: {
          sessionId: session.id,
          transactionId: session.payment_intent as string,
          amount: parseInt(amount) * 100,
          currency: 'usd',
          status: 'COMPLETED',
          paymentMethod: 'card',
          paymentType: 'MONTHLY_PEY_PRODUCT',
          userId,
        },
      });

      //  product monthly subscription
      const updatedUser = await this.prisma.user.update({
        where: { id: userId },
        data: {
          hasPaid: true,
          productMonthlyActive: true,
          productMonthlyStartDate: now,
          productMonthlyEndDate: endDate,
          productMonthlyPlanType: planNameParam,
        },
      });

      console.log('Product Monthly Subscription activated for user:', userId);

      try {
        const planNameParam = session.metadata?.planType || 'PRO';
        let friendlyPlan = 'Pro Seller Plan';
        if (planNameParam === 'BASIC') friendlyPlan = 'Basic Seller Plan';
        else if (planNameParam === 'GARAGE' || planNameParam === 'BUSINESS')
          friendlyPlan = 'Garage / Business Plan';

        const notif = await this.prisma.notification.create({
          data: {
            title: 'Subscription Updated',
            message: `Your subscription has been updated to ${friendlyPlan} (${amount} AED/month).`,
            type: 'ProductApproveUpdate',
            meta: {
              planName: friendlyPlan,
              price: `${amount} AED`,
              effectiveDate: now.toLocaleDateString('en-GB', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              }),
            },
          },
        });
        await this.prisma.userNotification.create({
          data: {
            userId,
            notificationId: notif.id,
          },
        });
        await this.notificationGateway.notifySingleUser(
          userId,
          'product-approve-update',
          {
            title: notif.title,
            message: notif.message,
            meta: notif.meta,
          },
        );
      } catch (err) {
        console.error(
          'Failed to send real-time notification for product_monthly_subscription:',
          err,
        );
      }

      const notification = await this.prisma.garageAdminNotification.findUnique(
        {
          where: {
            userId: userId,
          },
        },
      );
      console.log(
        'Product monthly subscription email',
        updatedUser?.isEmailNotification,
      );

      // Send email notification
      try {
        if (
          updatedUser?.role === UserRole.GARAGE_OWNER &&
          notification?.emailNotification
        ) {
          await this.mailService.sendPaymentConfirmationEmail(
            updatedUser.email,
            {
              userName: updatedUser.fullName || 'Valued Customer',
              paymentType: 'product_monthly',
              amount: parseInt(amount) * 100,
              transactionId: session.payment_intent as string,
              startDate: now,
              endDate: endDate,
            },
          );
        } else if (updatedUser?.isEmailNotification) {
          await this.mailService.sendPaymentConfirmationEmail(
            updatedUser.email,
            {
              userName: updatedUser.fullName || 'Valued Customer',
              paymentType: 'product_monthly',
              amount: parseInt(amount) * 100,
              transactionId: session.payment_intent as string,
              startDate: now,
              endDate: endDate,
            },
          );
        }
      } catch (emailError) {
        console.error('Failed to send email:', emailError);
      }
    } else if (type === 'product_promotion_credit') {
      console.log('🎯 Processing promotion credit for user:', userId);
      // Create payment record for promotion credit
      await this.prisma.payment.create({
        data: {
          sessionId: session.id,
          transactionId: session.payment_intent as string,
          amount: parseInt(amount) * 100,
          currency: 'usd',
          status: 'COMPLETED',
          paymentMethod: 'card',
          paymentType: 'PRODUCT_PROMOTION_CREDIT',
          userId,
          // planId: null for custom payments
        },
      });

      // Give user 1 promotion credit
      const updatedUser = await this.prisma.user.update({
        where: { id: userId },
        data: {
          hasPaid: true,
          promotionCredits: {
            increment: 1,
          },
        },
      });
      console.log(
        '✅ User updated with promotion credit:',
        updatedUser.promotionCredits,
      );

      const notification = await this.prisma.garageAdminNotification.findUnique(
        {
          where: {
            userId: userId,
          },
        },
      );

      // Send email notification
      try {
        if (
          updatedUser?.role === UserRole.GARAGE_OWNER &&
          notification?.emailNotification
        ) {
          await this.mailService.sendPaymentConfirmationEmail(
            updatedUser.email,
            {
              userName: updatedUser.fullName || 'Valued Customer',
              paymentType: 'promotional',
              amount: parseInt(amount) * 100,
              transactionId: session.payment_intent as string,
            },
          );
        } else if (
          updatedUser?.isEmailNotification &&
          updatedUser?.isEmailPromotional
        ) {
          await this.mailService.sendPaymentConfirmationEmail(
            updatedUser.email,
            {
              userName: updatedUser.fullName || 'Valued Customer',
              paymentType: 'promotional',
              amount: parseInt(amount) * 100,
              transactionId: session.payment_intent as string,
            },
          );
        }
      } catch (emailError) {
        console.error('Failed to send email:', emailError);
      }
    } else if (type === 'product_promotion' && productId) {
      // Create payment record
      await this.prisma.payment.create({
        data: {
          sessionId: session.id,
          transactionId: session.payment_intent as string,
          amount: parseInt(amount) * 100,
          currency: 'usd',
          status: 'COMPLETED',
          paymentMethod: 'card',
          paymentType: 'PRODUCT_PROMOTION',
          userId,
          productId,
          // planId: null for custom payments
        },
      });

      // Update product status to APPROVED and set promoted
      const product = await this.prisma.product.update({
        where: { id: productId },
        data: {
          status: 'APPROVED',
          isPromoted: true,
        },
      });

      // Update user's payment status
      const updatedUser = await this.prisma.user.update({
        where: { id: userId },
        data: { hasPaid: true },
      });

      // Send email notification
      try {
        await this.mailService.sendPaymentConfirmationEmail(updatedUser.email, {
          userName: updatedUser.fullName || 'Valued Customer',
          paymentType: 'promotional',
          amount: parseInt(amount) * 100,
          transactionId: session.payment_intent as string,
          productName: product.partName || productName || 'Your Product',
        });
      } catch (emailError) {
        console.error('Failed to send email:', emailError);
      }
    } else if (type === 'product_purchase') {
      // Generic product purchase (backward compatibility)
      await this.prisma.payment.create({
        data: {
          sessionId: session.id,
          transactionId: session.payment_intent as string,
          amount: parseInt(amount) * 100,
          currency: 'usd',
          status: 'COMPLETED',
          paymentMethod: 'card',
          paymentType: 'GENERAL',
          userId,
        },
      });

      await this.prisma.user.update({
        where: { id: userId },
        data: { hasPaid: true },
      });
    }
  }

  private async handlePaymentSuccess(
    paymentIntent: Stripe.PaymentIntent,
  ): Promise<void> {
    const { userId, type } = paymentIntent.metadata;
    console.log(userId, type);

    if (type === 'product_creation') {
      // Create payment record
      await this.prisma.payment.create({
        data: {
          sessionId: paymentIntent.id,
          transactionId: paymentIntent.id,
          amount: paymentIntent.amount,
          currency: paymentIntent.currency,
          status: 'COMPLETED',
          paymentMethod: 'card',
          paymentType: 'PAY_PER_PRODUCT',
          userId,
        },
      });

      // Update user's payment status
      await this.prisma.user.update({
        where: { id: userId },
        data: { hasPaid: true },
      });
    }
  }

  private async handlePaymentFailed(
    paymentIntent: Stripe.PaymentIntent,
  ): Promise<void> {
    console.log('Payment failed:', paymentIntent.id);
    // Handle payment failure logic here
  }

  // Increment user's free product count
  @HandleError('Failed to increment product count')
  async incrementFreeProductCount(userId: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        freeProductsUsed: {
          increment: 1,
        },
      },
    });
  }

  // Check if user has active monthly subscription
  @HandleError('Failed to check monthly subscription')
  async hasActiveMonthlySubscription(userId: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        subscriptionEndsAt: true,
        isMembership: true,
      },
    });

    if (!user) throw new NotFoundException('User not found');

    // Check if user has membership and subscription hasn't expired
    return (
      Boolean(user.isMembership) &&
      Boolean(user.subscriptionEndsAt) &&
      user.subscriptionEndsAt !== null &&
      new Date(user.subscriptionEndsAt) > new Date()
    );
  }

  // Create checkout session for monthly plan ($100)
  @HandleError('Failed to create monthly plan session')
  async createMonthlyPlanSession(userId: string): Promise<{ url: string }> {
    console.log('💰 Creating monthly plan session for user:', userId);

    const session = await this.stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Monthly Subscription Plan',
              description: 'Unlimited product listings for 30 days',
            },
            unit_amount: 10000,
          },
          quantity: 1,
        },
      ],
      success_url: `${process.env.FRONTEND_URL}/payment-success`,
      cancel_url: `${process.env.FRONTEND_URL}/payment-cancel?type=monthly`,

      metadata: {
        userId,
        type: 'monthly_subscription',
        amount: '100',
      },
    });

    return { url: session.url! };
  }

  // Create checkout session for Product Monthly Plan (Basic/Pro/Garage) - ONLY for product listings
  @HandleError('Failed to create product monthly session')
  async createProductMonthlySession(
    userId: string,
    planType: string = 'PRO',
  ): Promise<{ url: string }> {
    console.log(
      `Creating PRODUCT MONTHLY ${planType} session for user:`,
      userId,
    );

    const paymentConfig = await this.prisma.paymentConfigure.findFirst();

    if (!paymentConfig) {
      throw new InternalServerErrorException(
        'Platform payment configuration missing!',
      );
    }

    let price = 59;
    let description = 'Unlimited product listings for 30 days (Pro Seller)';
    let planLabel = 'Pro Seller Plan';

    const normalizedPlan = planType.toUpperCase();
    if (normalizedPlan === 'BASIC') {
      price = Number(paymentConfig.monthlyBasicPrice || 29);
      description = 'Up to 10 product listings for 30 days (Basic Seller)';
      planLabel = 'Basic Seller Plan';
    } else if (normalizedPlan === 'GARAGE' || normalizedPlan === 'BUSINESS') {
      price = Number(paymentConfig.monthlyGaragePrice || 99);
      description =
        'Unlimited product listings with priority ranking for 30 days (Garage Partner)';
      planLabel = 'Garage/Business Plan';
    } else {
      price = Number(paymentConfig.monthlyProPrice || 59);
    }

    const session = await this.stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Product Monthly Plan - ${planLabel}`,
              description: description,
            },
            unit_amount: price * 100,
          },
          quantity: 1,
        },
      ],
      success_url: `${process.env.FRONTEND_URL}/payment-success`,
      cancel_url: `${process.env.FRONTEND_URL}/payment-cancel?type=product_monthly`,
      metadata: {
        userId,
        type: 'product_monthly_subscription',
        planType: normalizedPlan,
        amount: `${price}`,
      },
    });

    return { url: session.url! };
  }

  // Create checkout session for pay-per product ($20)
  @HandleError('Failed to create pay-per session')
  async createPayPerProductSession(userId: string): Promise<{ url: string }> {
    console.log('💳 Creating pay-per session for user:', userId);

    const paymentConfig = await this.prisma.paymentConfigure.findFirst();

    if (!paymentConfig) {
      throw new InternalServerErrorException(
        'Platform payment configuration missing!',
      );
    }

    const perPerListingPrice = Number(paymentConfig?.perListingPrice || 0);

    const session = await this.stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Pay Per Product',
              description: 'Single product listing fee',
            },
            unit_amount: perPerListingPrice * 100,
          },
          quantity: 1,
        },
      ],
      success_url: `${process.env.FRONTEND_URL}/payment-success`,
      cancel_url: `${process.env.FRONTEND_URL}/payment-cancel?type=pay_per`,
      metadata: {
        userId,
        type: 'pay_per_product',
        amount: `${perPerListingPrice}`,
      },
    });

    return { url: session.url! };
  }

  // Check if user has product creation credits from pay-per payments
  @HandleError('Failed to check product credits')
  async hasProductCreationCredits(userId: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { freeProductsListing: true },
    });

    if (!user) throw new NotFoundException('User not found');

    return (user.freeProductsListing || 0) > 0;
  }

  // Use one product creation credit
  @HandleError('Failed to use product credit')
  async useProductCreationCredit(userId: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        freeProductsListing: {
          decrement: 1,
        },
      },
    });
  }

  // Check if user has promotion credits
  @HandleError('Failed to check promotion credits')
  async hasPromotionCredits(userId: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { promotionCredits: true },
    });

    if (!user) throw new NotFoundException('User not found');

    return (user.promotionCredits || 0) > 0;
  }

  // Use one promotion credit
  @HandleError('Failed to use promotion credit')
  async usePromotionCredit(userId: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        promotionCredits: {
          decrement: 1,
        },
      },
    });
  }

  // Create checkout session for product promotion (3 days or 7 days)
  @HandleError('Failed to create promotion session')
  async createPromotionPaymentSession(
    userId: string,
    duration: string = '7',
  ): Promise<{ url: string }> {
    console.log(
      `🎯 Creating promotion session (${duration} days) for user:`,
      userId,
    );

    const paymentConfig = await this.prisma.paymentConfigure.findFirst();

    if (!paymentConfig) {
      throw new InternalServerErrorException(
        'Platform payment configuration missing!',
      );
    }

    let price = 99;
    let description = 'Promote your product listing for 7 days';

    if (duration === '3') {
      price = Number(paymentConfig.promotionalAdPrice3Days || 49);
      description = 'Promote your product listing for 3 days';
    } else {
      price = Number(paymentConfig.promotionalAdPrice7Days || 99);
    }

    const session = await this.stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Product Promotion - ${duration} Days`,
              description: description,
            },
            unit_amount: price * 100,
          },
          quantity: 1,
        },
      ],
      success_url: `${process.env.FRONTEND_URL}/payment-success`,
      cancel_url: `${process.env.FRONTEND_URL}/payment-cancel?type=promotion`,
      metadata: {
        userId,
        type: 'product_promotion_credit',
        duration,
        amount: `${price}`,
      },
    });

    return { url: session.url! };
  }

  // Check if user has ACTIVE Product Monthly Plan ($100)
  @HandleError('Failed to check product monthly subscription')
  async hasActiveProductMonthly(userId: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        productMonthlyActive: true,
        productMonthlyEndDate: true,
      },
    });

    if (!user) return false;

    return (
      user.productMonthlyActive === true &&
      user.productMonthlyEndDate !== null &&
      new Date(user.productMonthlyEndDate) > new Date()
    );
  }
}
