import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from 'src/lib/prisma/prisma.service';
import { HandleError } from 'src/common/error/handle-error.decorator';
import { CreateCheckoutPlanDto } from '../dto/checkout-plan.dto';
import Stripe from 'stripe';
import { PaymentStatus } from '@prisma/client';
@Injectable()
export class PaymentService {
  private stripe: Stripe;

  constructor(private readonly prisma: PrismaService) {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {});
  }

  // ---------------- create payment ----------------

  @HandleError('Failed to create payment')
  async createCheckoutSession(
    userId: string,
    payload: CreateCheckoutPlanDto,
  ): Promise<{ url: string }> {
    // 1. Find plan from DB
    const plan = await this.prisma.paymentplan.findUnique({
      where: { id: payload.planId },
    });

    if (!plan) throw new NotFoundException('Payment plan not found');

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

    // 3. Save initial payment (status PENDING)
    // await this.prisma.payment.create({
    //   data: {
    //     sessionId: session.id,
    //     amount: plan.Price * 100, // cents
    //     currency: 'usd',
    //     status: PaymentStatus.PENDING,
    //     paymentMethod: 'card',
    //     userId,
    //     planId: plan.id,
    //   },
    // });

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
          },
        },
        plan: {
          select: {
            id: true,
            name: true,
            Price: true,
            billingCycle: true,
          },
        },
      },
    });

    return payments;
    // or if you have a successResponse helper:
    // return successResponse('Payments fetched successfully', payments);
  }

  // Check if user can create free product
  @HandleError('Failed to check product limit')
  async canCreateFreeProduct(userId: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { freeProductsUsed: true },
    });

    if (!user) throw new NotFoundException('User not found');

    return user.freeProductsUsed < 2; // Free limit is 2
  }

  // Create checkout session for specific product payment
  @HandleError('Failed to create product payment session')
  async createProductPaymentSession(
    userId: string,
    productId: string,
    description?: string,
  ): Promise<{ url: string }> {
    // 1. Get product details
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) throw new NotFoundException('Product not found');
    if (product.sellerId !== userId)
      throw new BadRequestException('You can only pay for your own products');

    // 2. Calculate payment amount (promotion fee)
    const promotionFee = 20; // 20 AED as mentioned in your code

    // 3. Create Stripe checkout session
    const session = await this.stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Promote: ${product.partName}`,
              description:
                description || `Promotion fee for ${product.partName}`,
            },
            unit_amount: promotionFee * 100, // Convert to cents
          },
          quantity: 1,
        },
      ],
      success_url: `${process.env.FRONTEND_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}&product_id=${productId}`,
      cancel_url: `${process.env.FRONTEND_URL}/payment-cancel?product_id=${productId}`,
      metadata: {
        userId,
        productId,
        type: 'product_promotion',
        amount: promotionFee.toString(),
      },
    });

    return { url: session.url! };
  }

  // Create checkout session for product payment (dynamic price) - Keep for backward compatibility
  @HandleError('Failed to create product checkout session')
  async createProductCheckoutSession(
    userId: string,
    productName: string,
    amount: number,
    description?: string,
  ): Promise<{ url: string }> {
    const session = await this.stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: productName,
              description: description || 'Product purchase',
            },
            unit_amount: Math.round(amount * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      success_url: `${process.env.FRONTEND_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/payment-cancel`,
      metadata: {
        userId,
        type: 'product_purchase',
        productName,
        amount: amount.toString(),
      },
    });

    return { url: session.url! };
  }

  // Handle webhook events
  @HandleError('Failed to handle webhook')
  async handleWebhook(signature: string, body: Buffer): Promise<void> {
    let event: Stripe.Event;

    try {
      event = this.stripe.webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET!,
      );
    } catch (err) {
      throw new BadRequestException(
        `Webhook signature verification failed: ${err.message}`,
      );
    }

    switch (event.type) {
      case 'checkout.session.completed':
        await this.handleCheckoutSuccess(
          event.data.object as Stripe.Checkout.Session,
        );
        break;
      case 'payment_intent.succeeded':
        await this.handlePaymentSuccess(
          event.data.object as Stripe.PaymentIntent,
        );
        break;
      case 'payment_intent.payment_failed':
        await this.handlePaymentFailed(
          event.data.object as Stripe.PaymentIntent,
        );
        break;
      default:
        console.log(`Unhandled event type: ${event.type}`);
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
      // Create payment record
      await this.prisma.payment.create({
        data: {
          sessionId: session.id,
          transactionId: session.payment_intent as string,
          amount: parseInt(amount) * 100,
          currency: 'usd',
          status: 'COMPLETED',
          paymentMethod: 'card',
          userId,
          // planId: null for custom payments
        },
      });

      // Update user's subscription status
      const subscriptionEndDate = new Date();
      subscriptionEndDate.setMonth(subscriptionEndDate.getMonth() + 1); // Add 1 month

      const updatedUser = await this.prisma.user.update({
        where: { id: userId },
        data: {
          hasPaid: true,
          isMembership: true,
          subscriptionEndsAt: subscriptionEndDate,
        },
      });
      console.log(
        '✅ User subscription activated:',
        updatedUser.isMembership,
        updatedUser.subscriptionEndsAt,
      );
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
          userId,
          // planId: null for custom payments
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
            increment: 1
          }
        }
      });
      console.log('✅ User updated with promotion credit:', updatedUser.promotionCredits);
    } else if (type === 'product_promotion' && productId) {
      // Create payment record
      await this.prisma.payment.create({
        data: {
          sessionId: session.id,
          transactionId: session.payment_intent as string,
          amount: parseInt(amount) * 100, // Convert back to cents
          currency: 'usd',
          status: 'COMPLETED',
          paymentMethod: 'card',
          userId,
          // planId: null for custom payments
        },
      });

      // Update product status to APPROVED and set promoted
      await this.prisma.product.update({
        where: { id: productId },
        data: {
          status: 'APPROVED',
          isPromoted: true,
        },
      });

      // Update user's payment status
      await this.prisma.user.update({
        where: { id: userId },
        data: { hasPaid: true },
      });
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
          userId,
          planId: productName
            ? `product-${productName.toLowerCase().replace(/\s+/g, '-')}`
            : 'general-payment',
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
          userId,
          planId: 'product-creation',
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
            unit_amount: 10000, // $100 in cents
          },
          quantity: 1,
        },
      ],
      success_url: `${process.env.FRONTEND_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}&type=monthly`,
      cancel_url: `${process.env.FRONTEND_URL}/payment-cancel?type=monthly`,
      metadata: {
        userId,
        type: 'monthly_subscription',
        amount: '100',
      },
    });

    return { url: session.url! };
  }

  // Create checkout session for pay-per product ($20)
  @HandleError('Failed to create pay-per session')
  async createPayPerProductSession(userId: string): Promise<{ url: string }> {
    console.log('💳 Creating pay-per session for user:', userId);

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
            unit_amount: 2000, // $20 in cents
          },
          quantity: 1,
        },
      ],
      success_url: `${process.env.FRONTEND_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}&type=pay_per`,
      cancel_url: `${process.env.FRONTEND_URL}/payment-cancel?type=pay_per`,
      metadata: {
        userId,
        type: 'pay_per_product',
        amount: '20',
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
      select: { promotionCredits: true }
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
          decrement: 1
        }
      }
    });
  }

  // Create checkout session for product promotion ($20)
  @HandleError('Failed to create promotion session')
  async createPromotionPaymentSession(userId: string): Promise<{ url: string }> {
    console.log('🎯 Creating promotion session for user:', userId);
    
    const session = await this.stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Product Promotion',
              description: 'Promote your product listing',
            },
            unit_amount: 2000, // $20 in cents
          },
          quantity: 1,
        },
      ],
      success_url: `${process.env.FRONTEND_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}&type=promotion`,
      cancel_url: `${process.env.FRONTEND_URL}/payment-cancel?type=promotion`,
      metadata: {
        userId,
        type: 'product_promotion_credit',
        amount: '20',
      },
    });

    return { url: session.url! };
  }
}
