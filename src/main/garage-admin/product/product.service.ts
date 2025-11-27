// src/modules/product/product.service.ts

import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
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
  ) {}

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
      plan,
      categoryId,
      ...productData
    } = createProductDto;

    // Validate seller email
    if (!sellerEmail) {
      throw new BadRequestException('Seller email is required.');
    }

    const categoryExists = await this.prisma.partsCategory.findUnique({
      where: { id: categoryId },
    });

    if (!categoryExists) {
      throw new BadRequestException(
        `Category with ID "${categoryId}" not found. Please choose a valid category.`,
      );
    }

    // Handle promotion (requires $20 promotion credit)
    if (productData.isPromoted) {
      const hasCredit = await this.paymentService.hasPromotionCredits(userId);
      if (!hasCredit) {
        throw new BadRequestException({
          message: 'Payment required for product promotion',
          code: 'PROMOTION_PAYMENT_REQUIRED',
          amount: 20,
        });
      }
      await this.paymentService.usePromotionCredit(userId);
    }

    // Check if user can create product without new payment
    const canUseFreeSlot =
      await this.paymentService.canCreateFreeProduct(userId);
    const hasPayPerCredit =
      await this.paymentService.hasProductCreationCredits(userId);
    const hasProductMonthlyPlan =
      await this.paymentService.hasActiveProductMonthly(userId);

    const canCreateWithoutPayment =
      canUseFreeSlot || hasPayPerCredit || hasProductMonthlyPlan;

    // If no free slot, no credit, no active Product Monthly → force payment
    if (!canCreateWithoutPayment) {
      if (plan === 'PAY_PER') {
        throw new BadRequestException({
          message: 'Payment required to create this product',
          code: 'PAY_PER_PAYMENT_REQUIRED',
          amount: 20,
          plan: 'PAY_PER',
        });
      }

      if (plan === 'MONTHLY') {
        throw new BadRequestException({
          message:
            'Product Monthly subscription required for unlimited listings',
          code: 'PRODUCT_MONTHLY_REQUIRED',
          amount: 100,
          plan: 'MONTHLY',
        });
      }

      throw new BadRequestException(
        'Free limit exceeded. Payment or subscription required.',
      );
    }

    // Consume free slot if used
    if (canUseFreeSlot) {
      await this.paymentService.incrementFreeProductCount(userId);
    }

    // Consume pay-per-product credit if used
    if (hasPayPerCredit && !canUseFreeSlot && !hasProductMonthlyPlan) {
      await this.paymentService.useProductCreationCredit(userId);
    }

    // Find or create seller
    let seller = await this.prisma.seller.findUnique({
      where: { email: sellerEmail },
    });

    if (!seller) {
      seller = await this.prisma.seller.create({
        data: {
          name: sellerName,
          email: sellerEmail,
          phoneNumber: sellerPhoneNumber,
          sellerType,
        },
      });
    }

    // Upload photos to S3
    const photoUrls: string[] = [];
    if (files.length > 0) {
      for (const file of files) {
        const { url } = await this.s3FileService.processUploadedFile(file);
        photoUrls.push(url);
      }
    }

    // Create product
    return this.prisma.product.create({
      data: {
        sellerId: seller.id,
        createdById: userId,
        status: 'PENDING',
        photos: photoUrls,
        views: 0,
        promoCost: productData.isPromoted ? 20 : null,
        categoryId,
        ...productData,
      },
      include: {
        seller: true,
        createdBy: { select: { id: true, email: true, fullName: true } },
      },
    });
  }

  async findAll() {
    return this.prisma.product.findMany({
      include: {
        seller: true,
        createdBy: { select: { id: true, email: true, fullName: true } },
      },
    });
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        seller: true,
        createdBy: { select: { id: true, email: true, fullName: true } },
      },
    });

    if (!product)
      throw new NotFoundException(`Product with ID ${id} not found`);

    return product;
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
        createdBy: {
          select: {
            id: true,
            email: true,
            fullName: true,
          },
        },
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
        createdBy: {
          select: {
            id: true,
            email: true,
            fullName: true,
          },
        },
      },
    });
  }

  // User limit status (now shows both Garage & Product Monthly plans)
  async getUserProductLimit(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        email: true,
        freeProductsUsed: true,
        freeProductsListing: true,
        subscriptionEndsAt: true,
        isMembership: true,
        productMonthlyActive: true,
        productMonthlyEndDate: true,
      },
    });

    if (!user) {
      return {
        freeProductsUsed: 0,
        freeProductsRemaining: 2,
        productCredits: 0,
        hasGarageMonthly: false,
        hasProductMonthly: false,
      };
    }

    const freeUsed = user.freeProductsUsed || 0;
    const credits = user.freeProductsListing || 0;

    const hasGarageMonthly = Boolean(
      user.isMembership &&
        user.subscriptionEndsAt &&
        new Date(user.subscriptionEndsAt) > new Date(),
    );

    const hasProductMonthly = Boolean(
      user.productMonthlyActive &&
        user.productMonthlyEndDate &&
        new Date(user.productMonthlyEndDate) > new Date(),
    );

    return {
      userId,
      userEmail: user.email,
      freeProductsUsed: freeUsed,
      freeProductsRemaining: Math.max(0, 2 - freeUsed),
      canAddFreeProduct: freeUsed < 2,
      productCredits: credits,
      hasGarageMonthly,
      hasProductMonthly,
      productMonthlyEndsAt: user.productMonthlyEndDate,
    };
  }
}
