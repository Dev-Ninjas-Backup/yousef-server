// src/modules/product/product.service.ts

import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { AppError } from 'src/common/error/handle-error.app';
import { HandleError } from 'src/common/error/handle-error.decorator';
import { successResponse } from 'src/common/utilsResponse/response.util';
import { MailService } from 'src/lib/mail/mail.service';
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
    private mailService: MailService,
  ) {}

  async create(
    userId: string,
    createProductDto: CreateProductDto,
    files: Express.Multer.File[] = [],
    verificationImageFile?: Express.Multer.File,
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
    console.log('create', createProductDto);

    // Validate seller email
    if (!sellerEmail) {
      throw new BadRequestException('Seller email is required.');
    }

    // Validate verificationImage for VERIFIED_SUPPLIER
    if (sellerType === 'VERIFIED_SUPPLIER' && !verificationImageFile) {
      throw new BadRequestException(
        'Verification image is required for VERIFIED_SUPPLIER seller type.',
      );
    }

    const categoryExists = await this.prisma.partsCategory.findUnique({
      where: { id: categoryId },
    });

    const paymentConfig = await this.prisma.paymentConfigure.findFirst();

    if (!paymentConfig) {
      throw new InternalServerErrorException(
        'Platform payment configuration missing!',
      );
    }

    const promotionalAdPrice = Number(paymentConfig?.promotionalAdPrice || 0);
    const perPerListingPrice = Number(paymentConfig?.perListingPrice || 0);
    const sparePartsMonthlySubscription = Number(
      paymentConfig?.sparePartsMonthly || 0,
    );
    // const freePromotionalListings = Number(
    //   paymentConfig?.freePromotionalListings || 0,
    // );
    // console.log(promotionalAdPrice, perListingPrice, freePromotionalListings, sparePartsMonthlySubscription);

    if (!categoryExists) {
      throw new BadRequestException(
        `Category with ID "${categoryId}" not found.Please choose a valid category.`,
      );
    }

    // Check promotion credit availability (but don't consume yet)
    if (productData.isPromoted) {
      const hasCredit = await this.paymentService.hasPromotionCredits(userId);
      if (!hasCredit) {
        throw new BadRequestException({
          message: `${promotionalAdPrice}$ Payment required for product promotion`,
          code: 'PROMOTION_PAYMENT_REQUIRED',
          amount: promotionalAdPrice,
        });
      }
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

    // Validate plan selection against user's subscription status
    if (hasProductMonthlyPlan && plan === 'PAY_PER') {
      throw new BadRequestException({
        message:
          'You have an active Product Monthly subscription. Cannot use PAY_PER plan.',
        code: 'INVALID_PLAN_SELECTION',
      });
    }

    // If no free slot, no credit, no active Product Monthly → force payment
    if (!canCreateWithoutPayment) {
      if (plan === 'PAY_PER') {
        throw new BadRequestException({
          message: `${perPerListingPrice}$ Pay-Per payment required to create this product`,
          code: 'PAY_PER_PAYMENT_REQUIRED',
          amount: perPerListingPrice,
          plan: 'PAY_PER',
        });
      }

      if (plan === 'MONTHLY') {
        throw new BadRequestException({
          message: `${sparePartsMonthlySubscription}$ Product Monthly subscription required for unlimited listings`,
          code: 'PRODUCT_MONTHLY_SUBSCRIPTION_REQUIRED',
          amount: sparePartsMonthlySubscription,
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

    // Upload verification image if provided
    let verificationImageUrl: string | null = null;
    if (verificationImageFile) {
      const { url } = await this.s3FileService.processUploadedFile(
        verificationImageFile,
      );
      verificationImageUrl = url;
    }

    if (!seller) {
      seller = await this.prisma.seller.create({
        data: {
          name: sellerName,
          email: sellerEmail,
          phoneNumber: sellerPhoneNumber,
          sellerType,
          verificationImage: verificationImageUrl,
        },
      });
    } else if (verificationImageUrl) {
      // Update existing seller with verification image
      seller = await this.prisma.seller.update({
        where: { id: seller.id },
        data: {
          verificationImage: verificationImageUrl,
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
    const product = await this.prisma.product.create({
      data: {
        sellerId: seller.id,
        createdById: userId,
        status: 'PENDING',
        photos: photoUrls,
        views: 0,
        promoCost: productData.isPromoted ? promotionalAdPrice : null,
        categoryId,
        ...productData,
      },
      include: {
        seller: true,
        createdBy: { select: { id: true, email: true, fullName: true } },
        category: true,
      },
    });

    // Only consume promotion credit AFTER successful product creation
    if (productData.isPromoted) {
      await this.paymentService.usePromotionCredit(userId);
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      throw new AppError(404, 'User not found');
    }

    const productNotification =
      await this.prisma.garageAdminNotification.findUnique({
        where: {
          userId: userId,
        },
        select: { emailNotification: true },
      });
    console.log(
      'Product Email Notification',
      productNotification?.emailNotification,
    );

    if (
      user?.role === UserRole.GARAGE_OWNER &&
      productNotification?.emailNotification
    ) {
      console.log('Product Email Notification');
      await this.mailService.sendProductUpdateEmail(user.email as string, {
        userName: user?.fullName as string,
        productName: product?.partName as string,
        status: 'PENDING',
      });
    } else if (user?.isEmailNotification) {
      console.log('Product Email Notification');
      await this.mailService.sendProductUpdateEmail(user.email as string, {
        userName: user?.fullName as string,
        productName: product?.partName as string,
        status: 'PENDING',
      });
    }

    return successResponse(product, 'Product created successfully');
  }
  // --------------find all with search, filter, pagination, last 30 days only----------------
  async findAll(query?: {
    page?: number;
    limit?: number;
    search?: string;
    category?: string;
    condition?: string;
    status?: string;
    sortBy?: string;
  }) {
    const page = query?.page || 1;
    const limit = query?.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};

    // Date filter: only products from last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setHours(0, 0, 0, 0);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    where.createdAt = { gte: thirtyDaysAgo };

    if (query?.search) {
      where.OR = [
        { partName: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
        { brand: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    if (query?.category) {
      where.category = {
        name: { contains: query.category, mode: 'insensitive' },
      };
    }

    if (query?.condition) {
      where.condition = query.condition;
    }

    if (query?.status) {
      where.status = query.status;
    }

    // Build orderBy based on sortBy
    let orderBy: any[];
    switch (query?.sortBy) {
      case 'price_asc':
      case 'price_desc':
        // Price is stored as string, so we can't sort directly in DB
        // We'll fetch all and sort in memory
        orderBy = [{ isPromoted: 'desc' }, { createdAt: 'desc' }];
        break;
      case 'newest':
        orderBy = [{ isPromoted: 'desc' }, { createdAt: 'desc' }];
        break;
      default: // relevance — promoted first, then newest
        orderBy = [{ isPromoted: 'desc' }, { createdAt: 'desc' }];
    }

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        include: {
          seller: true,
          createdBy: { select: { id: true, email: true, fullName: true } },
          category: true,
        },
        skip,
        take: limit,
        orderBy,
      }),
      this.prisma.product.count({ where }),
    ]);

    // Sort by price in memory if needed
    if (query?.sortBy === 'price_asc' || query?.sortBy === 'price_desc') {
      products.sort((a, b) => {
        const priceA = Number(a.price) || 0;
        const priceB = Number(b.price) || 0;

        // Promoted products always come first
        if (a.isPromoted !== b.isPromoted) {
          return a.isPromoted ? -1 : 1;
        }

        // Then sort by price
        return query.sortBy === 'price_asc' ? priceA - priceB : priceB - priceA;
      });
    }

    return {
      success: true,
      message: 'Products fetched successfully',
      data: products,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        seller: true,
        createdBy: { select: { id: true, email: true, fullName: true } },
        category: true,
      },
    });

    if (!product)
      throw new NotFoundException(`Product with ID ${id} not found`);

    // Increment views count
    await this.prisma.product.update({
      where: { id },
      data: { views: { increment: 1 } },
    });

    return { ...product, views: product.views + 1 };
  }

  // my products
  async findMyProducts(userId: string) {
    return this.prisma.product.findMany({
      where: { createdById: userId },
      include: {
        seller: true,
        createdBy: { select: { id: true, email: true, fullName: true } },
        category: true,
      },
    });
  }

  // --------------update product by id----------------
  @HandleError('Failed to update product')
  async update(
    id: string,
    updateProductDto: UpdateProductDto,
    files: Express.Multer.File[] = [],
    verificationImageFile?: Express.Multer.File,
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

    delete productData.verificationImage;
    delete productData.photos;

    // ----------- Validate verificationImage for VERIFIED_SUPPLIER ---------------
    if (
      sellerType === 'VERIFIED_SUPPLIER' &&
      !verificationImageFile &&
      !product.seller.verificationImage
    ) {
      throw new BadRequestException(
        'Verification image is required for VERIFIED_SUPPLIER seller type.',
      );
    }

    //-----------------  Upload new photos to S3 ----------------
    const photoUrls: string[] = [];
    if (files && files.length > 0) {
      //  ---------- Delete old photos from S3 ----------
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
          throw new Error(`Failed to upload photo: ${error.message} `);
        }
      }
    }

    // ----------------- Update seller if provided ----------------
    if (
      sellerName ||
      sellerEmail ||
      sellerPhoneNumber ||
      sellerType ||
      verificationImageFile
    ) {
      const sellerUpdateData: any = {};
      if (sellerName) sellerUpdateData.name = sellerName;
      if (sellerEmail) sellerUpdateData.email = sellerEmail;
      if (sellerPhoneNumber) sellerUpdateData.phoneNumber = sellerPhoneNumber;
      if (sellerType) sellerUpdateData.sellerType = sellerType;

      //  -------------- Upload verification image if provided -------------------
      if (verificationImageFile) {
        const { url } = await this.s3FileService.processUploadedFile(
          verificationImageFile,
        );
        sellerUpdateData.verificationImage = url;
      }

      await this.prisma.seller.update({
        where: { id: product.sellerId },
        data: sellerUpdateData,
      });
    }

    // ---------------- Update product with new photos array ----------------
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
        category: true,
      },
    });
  }

  // --------------delete product by id----------------

  @HandleError('Failed to delete product')
  async remove(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    const deletedProduct = await this.prisma.product.delete({
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
        category: true,
      },
    });

    return {
      message: 'Product deleted successfully',
      product: deletedProduct,
    };
  }

  // User limit status (now shows both Garage & Product Monthly plans)
  async getUserProductLimit(userId: string) {
    const paymentConfig = await this.prisma.paymentConfigure.findFirst();
    const freePromotionalListings = Number(
      paymentConfig?.freePromotionalListings,
    );

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
        promotionCredits: true,
      },
    });

    if (!user) {
      return {
        freeProductsUsed: 0,
        freeProductsRemaining: freePromotionalListings,
        productCredits: 0,
        hasGarageMonthly: false,
        hasProductMonthly: false,
      };
    }

    const freeUsed = user.freeProductsUsed || 0;
    const credits = user.freeProductsListing || 0;
    const promotionCredits = user.promotionCredits || 0;

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
      freeProductsRemaining: Math.max(0, freePromotionalListings - freeUsed),
      canAddFreeProduct: freeUsed < freePromotionalListings,
      productCredits: credits,
      promotionCredits: promotionCredits,
      hasGarageMonthly,
      hasProductMonthly,
      productMonthlyEndsAt: user.productMonthlyEndDate,
    };
  }
}
