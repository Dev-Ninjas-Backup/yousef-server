import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/lib/prisma/prisma.service';
import { S3FileService } from 'src/lib/s3file/s3file.service';
import { PaymentService } from '../../shared/payment/service/payment.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductService {
  constructor(
    private prisma: PrismaService,
    private s3FileService: S3FileService,
    private paymentService: PaymentService,
  ) { }

  async create(
    userId: string,
    createProductDto: CreateProductDto,
    files: Express.Multer.File[] = [],
  ) {
    const {
      sellerEmail,
      sellerName,
      sellerPhoneNumber,
      sellerType,
      photos,
      plan,
      ...productData
    } = createProductDto;

    if (!sellerEmail) {
      throw new Error('validation: Seller email is required.');
    }

    // Check if user can create free product (first 2 are free)
    const canCreateFree = await this.paymentService.canCreateFreeProduct(userId);

    if (canCreateFree) {
      // User can create free product, increment count and proceed
      await this.paymentService.incrementFreeProductCount(userId);
    } else {
      // User has used free products, check plan and payment
      if (plan === 'PAY_PER') {
        // Check if user has product creation credits from pay-per payments
        const hasCredits = await this.paymentService.hasProductCreationCredits(userId);

        if (!hasCredits) {
          throw new BadRequestException({
            message: 'Payment required for pay-per product creation',
            code: 'PAY_PER_PAYMENT_REQUIRED',
            amount: 20,
            plan: 'PAY_PER',
            action: 'Please complete $20 payment to create this product'
          });
        }
        // User has credits, use one credit
        await this.paymentService.useProductCreationCredit(userId);
      } else if (plan === 'MONTHLY') {
        // For monthly plan, check if user has active subscription
        const hasActiveSubscription = await this.paymentService.hasActiveMonthlySubscription(userId);

        if (!hasActiveSubscription) {
          throw new BadRequestException({
            message: 'Monthly subscription required',
            code: 'MONTHLY_SUBSCRIPTION_REQUIRED',
            amount: 100,
            plan: 'MONTHLY',
            action: 'Please activate monthly subscription ($100) to create unlimited products'
          });
        }
        // User has active monthly subscription, can proceed
      }
    }

    // Find or create seller based on email
    let sellerInstance = await this.prisma.seller.findUnique({
      where: { email: sellerEmail },
    });

    if (!sellerInstance) {
      // Create seller if not found
      sellerInstance = await this.prisma.seller.create({
        data: {
          name: sellerName,
          email: sellerEmail,
          phoneNumber: sellerPhoneNumber,
          sellerType,
          freeProductsUsed: 0,
        },
      });
    }

    // Upload photos to S3
    const photoUrls: string[] = [];
    if (files && files.length > 0) {
      for (const file of files) {
        try {
          const { url } = await this.s3FileService.processUploadedFile(file);
          photoUrls.push(url);
        } catch (error) {
          throw new Error(`Failed to upload photo: ${error.message}`);
        }
      }
    }

    // Create product with photos array
    const product = await this.prisma.product.create({
      data: {
        sellerId: sellerInstance.id,
        status: 'PENDING',
        photos: photoUrls,
        views: 0,
        promoCost: productData.isPromoted ? 20 : null,
        ...productData,
      },
      include: {
        seller: true,
      },
    });

    return product;
  }

  async findAll() {
    return this.prisma.product.findMany({
      include: {
        seller: true,
      },
    });
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        seller: true,
      },
    });
    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    // Increment view count
    await this.prisma.product.update({
      where: { id },
      data: {
        views: {
          increment: 1,
        },
      },
    });

    return { ...product, views: product.views + 1 };
  }

  async update(
    id: string,
    updateProductDto: UpdateProductDto,
    files: Express.Multer.File[] = [],
  ) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: { seller: true },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    const {
      sellerName,
      sellerEmail,
      sellerPhoneNumber,
      sellerType,

      photos,
      ...productData
    } = updateProductDto;

    // Upload new photos to S3
    const photoUrls: string[] = [];
    if (files && files.length > 0) {
      // Delete old photos from S3
      if (product.photos && product.photos.length > 0) {
        await Promise.all(
          product.photos.map((photoUrl) =>
            (this.s3FileService as any).deleteFile(photoUrl),
          ),
        ).catch((e) => console.error('S3 Deletion during UPDATE Failed:', e));
      }

      for (const file of files) {
        try {
          const { url } = await this.s3FileService.processUploadedFile(file);
          photoUrls.push(url);
        } catch (error) {
          throw new Error(`Failed to upload photo: ${error.message}`);
        }
      }
    }

    // Update seller if provided
    if (sellerName || sellerEmail || sellerPhoneNumber || sellerType || false) {
      const sellerUpdateData: any = {};
      if (sellerName) sellerUpdateData.name = sellerName;
      if (sellerEmail) sellerUpdateData.email = sellerEmail;
      if (sellerPhoneNumber) sellerUpdateData.phoneNumber = sellerPhoneNumber;
      if (sellerType) sellerUpdateData.sellerType = sellerType;

      await this.prisma.seller.update({
        where: { id: product.sellerId },
        data: sellerUpdateData,
      });
    }

    // Update product with new photos array
    const updateData: any = {
      ...productData,
    };
    if (photoUrls.length > 0) {
      updateData.photos = photoUrls;
    }

    return this.prisma.product.update({
      where: { id },
      data: updateData,
      include: {
        seller: true,
      },
    });
  }

  async remove(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
    });
    console.log('Product', product);

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    return this.prisma.product.delete({
      where: { id },
      include: {
        seller: true,
      },
    });
  }

  async getUserProductLimit(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return {
        userId,
        userEmail: 'User not found',
        freeProductsUsed: 0,
        freeProductsRemaining: 2,
        canAddFreeProduct: true,
        hasActiveMonthlySubscription: false,
        subscriptionEndsAt: null,
      };
    }

    const freeProductsUsed = user.freeProductsUsed || 0;
    const freeProductsRemaining = Math.max(0, 2 - freeProductsUsed);
    const canAddFreeProduct = freeProductsUsed < 2;

    // Check monthly subscription status
    const hasActiveMonthlySubscription = user.isMembership &&
      user.subscriptionEndsAt &&
      new Date(user.subscriptionEndsAt) > new Date();

    return {
      userId,
      userEmail: user.email,
      freeProductsUsed,
      freeProductsRemaining,
      canAddFreeProduct,
      hasActiveMonthlySubscription,
      subscriptionEndsAt: user.subscriptionEndsAt,
    };
  }
}
