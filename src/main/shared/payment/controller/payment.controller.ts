import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  Headers,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { ApiBearerAuth } from '@nestjs/swagger';
import {
  GetUser,
  ValidateAuth,
  ValidateSuperAdmin,
} from 'src/common/jwt/jwt.decorator';
import { CreateCheckoutPlanDto } from '../dto/checkout-plan.dto';
import { CreateProductPaymentDto } from '../dto/create-product-payment.dto';
import { ProductPaymentDto } from '../dto/product-payment.dto';

import { PaymentService } from '../service/payment.service';

@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}
  @ApiBearerAuth()
  @ValidateAuth()
  @Post()
  async create(
    @Body() payload: CreateCheckoutPlanDto,
    @GetUser('userId') userId: string,
  ) {
    if (!userId) throw new BadRequestException('User not authenticated');
    return this.paymentService.createCheckoutSession(userId, payload);
  }

  @ApiBearerAuth()
  @ValidateAuth()
  @Get('/my-payments')
  async findmyPayment(@GetUser('userId') userId: string) {
    return this.paymentService.findmyPayment(userId);
  }

  // -------------------  Admin only -------------------
  @ApiBearerAuth()
  @ValidateSuperAdmin()
  @Get('all-payments')
  async findAll() {
    return this.paymentService.findAllPayments();
  }

  // Check if user can create free product
  @ApiBearerAuth()
  @ValidateAuth()
  @Get('/check-product-limit')
  async checkProductLimit(@GetUser('userId') userId: string) {
    const canCreate = await this.paymentService.canCreateFreeProduct(userId);
    return {
      canCreateFree: canCreate,
      message: canCreate ? 'You can create free product' : 'Payment required for more products'
    };
  }

  // Create checkout session for specific product promotion
  @ApiBearerAuth()
  @ValidateAuth()
  @Post('/product-promotion')
  async createProductPromotion(
    @GetUser('userId') userId: string,
    @Body() payload: ProductPaymentDto,
  ) {
    return this.paymentService.createProductPaymentSession(
      userId,
      payload.productId,
      payload.description,
    );
  }

  // Create checkout session for product payment (dynamic price)
  @ApiBearerAuth()
  @ValidateAuth()
  @Post('/create-product-payment')
  async createProductPayment(
    @GetUser('userId') userId: string,
    @Body() payload: CreateProductPaymentDto,
  ) {
    return this.paymentService.createProductCheckoutSession(
      userId,
      payload.productName,
      payload.amount,
      payload.description,
    );
  }

  // Get payments for specific product
  @ApiBearerAuth()
  @ValidateAuth()
  @Get('/product/:productId')
  async getProductPayments(
    @Param('productId') productId: string,
    @GetUser('userId') userId: string,
  ) {
    return this.paymentService.getProductPayments(productId, userId);
  }

  // Create checkout session for monthly subscription ($100)
  @ApiBearerAuth()
  @ValidateAuth()
  @Post('/monthly-subscription')
  async createMonthlySubscription(@GetUser('userId') userId: string) {
    return this.paymentService.createMonthlyPlanSession(userId);
  }

  // Create checkout session for pay-per product ($20)
  @ApiBearerAuth()
  @ValidateAuth()
  @Post('/pay-per-product')
  async createPayPerProduct(@GetUser('userId') userId: string) {
    return this.paymentService.createPayPerProductSession(userId);
  }

  // Check user subscription and payment status
  @ApiBearerAuth()
  @ValidateAuth()
  @Get('/subscription-status')
  async getSubscriptionStatus(@GetUser('userId') userId: string) {
    const canCreateFree = await this.paymentService.canCreateFreeProduct(userId);
    const hasActiveSubscription = await this.paymentService.hasActiveMonthlySubscription(userId);
    
    return {
      canCreateFree,
      hasActiveMonthlySubscription: hasActiveSubscription,
      paymentOptions: {
        monthly: {
          price: 100,
          currency: 'USD',
          description: 'Unlimited products for 30 days'
        },
        payPer: {
          price: 20,
          currency: 'USD',
          description: 'Single product creation'
        }
      }
    };
  }

  // Stripe webhook for product payments
  @Post('/webhook')
  async handleWebhook(
    @Headers('stripe-signature') signature: string,
    @Req() req: Request & { rawBody?: Buffer },
  ) {
    console.log('🔔 Webhook received at /payment/webhook');
    console.log('Signature present:', !!signature);
    console.log('Raw body present:', !!req.rawBody);
    
    if (!req.rawBody) {
      console.log('❌ No raw body found');
      throw new BadRequestException('Raw body is required for webhook');
    }
    
    try {
      const result = await this.paymentService.handleWebhook(signature, req.rawBody);
      console.log('✅ Webhook processed successfully');
      return result;
    } catch (error) {
      console.log('❌ Webhook processing failed:', error.message);
      throw error;
    }
  }




}
