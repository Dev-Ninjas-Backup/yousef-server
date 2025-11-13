import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  BadRequestException,
} from '@nestjs/common';
import { PaymentService } from '../service/payment.service';
import { UpdatePaymentDto } from '../dto/update-payment.dto';
import { GetUser, ValidateAuth, ValidateSuperAdmin } from 'src/common/jwt/jwt.decorator';
import { CreateCheckoutPlanDto } from '../dto/checkout-plan.dto';
import { ApiBearerAuth } from '@nestjs/swagger';

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
  @Get("/my-payments")
  async  findmyPayment(@GetUser('userId') userId: string) {
    return this.paymentService.findmyPayment(userId);
  }

  // -------------------  Admin only -------------------
  @ApiBearerAuth()
  @ValidateSuperAdmin()
  @Get('all-payments')
  async findAll() {
    return this.paymentService.findAllPayments();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.paymentService.findOne(+id);
  }



}
