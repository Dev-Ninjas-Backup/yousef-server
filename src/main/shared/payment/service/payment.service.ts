import { Injectable, NotFoundException } from '@nestjs/common';
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

  findOne(id: number) {
    return `This action returns a #${id} payment`;
  }
}
