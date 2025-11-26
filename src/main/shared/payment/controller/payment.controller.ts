import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Post,
  Req,
} from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import type { Request } from 'express';
import {
  GetUser,
  ValidateAuth,
  ValidateSuperAdmin,
} from 'src/common/jwt/jwt.decorator';

import { PaymentService } from '../service/payment.service';
import { CreateCheckoutPlanDto } from '../dto/checkout-plan.dto';

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

  // ---------------- Stripe webhook for payments-----------------
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
      const result = await this.paymentService.handleWebhook(
        signature,
        req.rawBody,
      );
      console.log('✅ Webhook processed successfully');
      console.log(result);
      return result;
    } catch (error) {
      console.log('❌ Webhook processing failed:', error.message);
      throw error;
    }
  }
}
