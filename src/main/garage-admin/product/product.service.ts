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
    const promotedDuration = createProductDto.promotedDuration || '15';
    const dto = createProductDto as any;
    delete dto.promotedDuration;
    delete dto.photos;
    delete dto.verificationImage;

    const {
      sellerEmail,
      sellerName,
      sellerPhoneNumber,
      sellerType,
      plan,
      categoryId,
      ...productData
    } = dto;
    if (
      productData.garageId === 'null' ||
      productData.garageId === 'none' ||
      productData.garageId === ''
    ) {
      productData.garageId = null;
    }
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

    const perPerListingPrice = Number(paymentConfig?.perListingPrice || 0);
    const sparePartsMonthlySubscription = Number(
      paymentConfig?.sparePartsMonthly || 0,
    );

    if (!categoryExists) {
      throw new BadRequestException(
        `Category with ID "${categoryId}" not found.Please choose a valid category.`,
      );
    }

    const isPromoted =
      productData.isPromoted === true || productData.isPromoted === 'true';

    // Calculate required promotion price
    let promoPrice = 99;
    if (promotedDuration === '7') {
      promoPrice = Number(paymentConfig?.promotionalAdPrice3Days || 49);
    } else {
      promoPrice = Number(paymentConfig?.promotionalAdPrice7Days || 99);
    }

    let promotedUntil: Date | null = null;
    if (isPromoted) {
      promotedUntil = new Date();
      promotedUntil.setDate(
        promotedUntil.getDate() + (promotedDuration === '7' ? 7 : 15),
      );
    }

    const isDraft = createProductDto.status === 'DRAFT';

    // Check promotion credit availability (but don't consume yet)
    if (isPromoted && !isDraft) {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { promotionCredits: true },
      });
      const userCredits = user?.promotionCredits || 0;
      if (userCredits < promoPrice) {
        throw new BadRequestException({
          message: `${promoPrice} AED payment or credits required for product promotion. Current credits: ${userCredits}`,
          code: 'PROMOTION_PAYMENT_REQUIRED',
          amount: promoPrice - userCredits,
        });
      }
    }

    let canUseFreeSlot = false;
    let hasPayPerCredit = false;
    let hasProductMonthlyPlan = false;
    let hasGarageMonthlyPlan = false;
    let isBasicLimitExceeded = false;

    if (!isDraft) {
      // Security Check: If listing under a garage, verify the garage ownership
      if (productData.garageId) {
        const garage = await this.prisma.garage.findUnique({
          where: { id: productData.garageId },
        });
        if (!garage || garage.userId !== userId) {
          throw new BadRequestException(
            'Invalid garage specified or garage does not belong to you.',
          );
        }
      }

      // Check if user can create product without new payment
      canUseFreeSlot = await this.paymentService.canCreateFreeProduct(userId);
      hasPayPerCredit =
        await this.paymentService.hasProductCreationCredits(userId);
      hasProductMonthlyPlan =
        await this.paymentService.hasActiveProductMonthly(userId);
      hasGarageMonthlyPlan =
        await this.paymentService.hasActiveMonthlySubscription(
          userId,
          productData.garageId || undefined,
        );

      const limitUser = await this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          productMonthlyPlanType: true,
          productMonthlyStartDate: true,
        },
      });

      if (
        hasProductMonthlyPlan &&
        limitUser?.productMonthlyPlanType === 'BASIC'
      ) {
        const activeProductsCount = await this.prisma.product.count({
          where: {
            createdById: userId,
            createdAt: {
              gte: limitUser.productMonthlyStartDate ?? new Date(0),
            },
          },
        });
        if (activeProductsCount >= 10) {
          isBasicLimitExceeded = true;
        }
      }

      const canCreateWithoutPayment =
        canUseFreeSlot ||
        hasPayPerCredit ||
        (hasProductMonthlyPlan && !isBasicLimitExceeded) ||
        hasGarageMonthlyPlan;

      // Validate plan selection against user's subscription status
      if (
        ((hasProductMonthlyPlan && !isBasicLimitExceeded) ||
          hasGarageMonthlyPlan) &&
        plan === 'PAY_PER'
      ) {
        throw new BadRequestException({
          message:
            'You have an active Monthly subscription. Cannot use PAY_PER plan.',
          code: 'INVALID_PLAN_SELECTION',
        });
      }

      // If Monthly plan limit is exceeded and they tried to use MONTHLY
      if (isBasicLimitExceeded && plan === 'MONTHLY') {
        if (!hasPayPerCredit) {
          throw new BadRequestException({
            message:
              'You have reached the limit of 10 listings for your Basic Plan. You must pay 9 AED to add more listings.',
            code: 'BASIC_PLAN_LIMIT_EXCEEDED',
            amount: 9,
            plan: 'PAY_PER',
          });
        }
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
    }

    if (!isDraft) {
      // Consume free slot if used
      if (canUseFreeSlot) {
        await this.paymentService.incrementFreeProductCount(userId);
      }

      // Consume pay-per-product credit if used
      if (
        hasPayPerCredit &&
        !canUseFreeSlot &&
        (!hasProductMonthlyPlan || isBasicLimitExceeded)
      ) {
        await this.paymentService.useProductCreationCredit(userId);
      }
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

    const expiresAt = new Date();
    if (productData.listingPlan === 'PAY_PER') {
      expiresAt.setDate(expiresAt.getDate() + 15);
    } else if (productData.listingPlan === 'MONTHLY_BASIC') {
      expiresAt.setDate(expiresAt.getDate() + 15);
    } else if (
      productData.listingPlan === 'MONTHLY_PRO' ||
      productData.listingPlan === 'MONTHLY_GARAGE'
    ) {
      expiresAt.setDate(expiresAt.getDate() + 30);
    } else {
      // Free plan
      expiresAt.setDate(expiresAt.getDate() + 15);
    }

    // Create product
    const product = await this.prisma.product.create({
      data: {
        sellerId: seller.id,
        createdById: userId,
        status: isDraft ? 'DRAFT' : 'PENDING',
        photos: photoUrls,
        views: 0,
        promoCost: isPromoted && !isDraft ? String(promoPrice) : null,
        promotedUntil: isDraft ? null : promotedUntil,
        categoryId,
        expiresAt: isDraft ? null : expiresAt,
        ...productData,
      },
      include: {
        seller: true,
        createdBy: {
          select: {
            id: true,
            email: true,
            fullName: true,
            role: true,
            profilePhoto: true,
            garageLogo: true,
          },
        },
        category: true,
      },
    });

    // Only consume promotion credit AFTER successful product creation
    if (isPromoted && !isDraft) {
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          promotionCredits: {
            decrement: promoPrice,
          },
        },
      });
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
    userId?: string;
    isPromoted?: boolean | string;
    sellerType?: string;
  }) {
    const page = query?.page || 1;
    const limit = query?.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};

    const now = new Date();

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setHours(0, 0, 0, 0);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const fortyFiveDaysAgo = new Date();
    fortyFiveDaysAgo.setHours(0, 0, 0, 0);
    fortyFiveDaysAgo.setDate(fortyFiveDaysAgo.getDate() - 45);

    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setHours(0, 0, 0, 0);
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    const andConditions: any[] = [];

    // Expiry / active listings filter
    andConditions.push({
      OR: [
        {
          expiresAt: { gte: now },
        },
        {
          expiresAt: null,
          OR: [
            {
              listingPlan: 'PAY_PER',
              createdAt: { gte: fortyFiveDaysAgo },
            },
            {
              listingPlan: {
                in: ['MONTHLY_BASIC', 'MONTHLY_PRO', 'MONTHLY_GARAGE'],
              },
              createdAt: { gte: sixtyDaysAgo },
            },
            {
              listingPlan: {
                notIn: [
                  'PAY_PER',
                  'MONTHLY_BASIC',
                  'MONTHLY_PRO',
                  'MONTHLY_GARAGE',
                ],
              },
              createdAt: { gte: thirtyDaysAgo },
            },
            {
              listingPlan: null,
              createdAt: { gte: thirtyDaysAgo },
            },
          ],
        },
      ],
    });

    if (query?.search) {
      andConditions.push({
        OR: [
          { partName: { contains: query.search, mode: 'insensitive' } },
          { description: { contains: query.search, mode: 'insensitive' } },
          { brand: { contains: query.search, mode: 'insensitive' } },
        ],
      });
    }

    if (query?.sellerType) {
      if (query.sellerType === 'GARAGE') {
        andConditions.push({
          createdBy: {
            role: 'GARAGE_OWNER',
          },
        });
      } else if (query.sellerType === 'SUPPLIER') {
        andConditions.push({
          createdBy: {
            role: { not: 'GARAGE_OWNER' },
          },
          seller: {
            sellerType: 'VERIFIED_SUPPLIER',
          },
        });
      } else if (query.sellerType === 'INDIVIDUAL') {
        andConditions.push({
          createdBy: {
            role: { not: 'GARAGE_OWNER' },
          },
          seller: {
            sellerType: 'INDIVIDUAL',
          },
        });
      }
    }

    where.AND = andConditions;

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

    if (query?.userId) {
      where.createdById = query.userId;
    }

    if (query?.isPromoted !== undefined) {
      where.isPromoted =
        query.isPromoted === true || query.isPromoted === 'true';
    }

    // Build orderBy based on sortBy
    let orderBy: any[];
    switch (query?.sortBy) {
      case 'price_asc':
      case 'price_desc':
        // Price is stored as string, so we can't sort directly in DB
        // We'll fetch all and sort in memory
        orderBy = [
          { isPromoted: 'desc' },
          { createdBy: { productMonthlyActive: 'desc' } },
          { createdAt: 'desc' },
        ];
        break;
      case 'newest':
        orderBy = [
          { isPromoted: 'desc' },
          { createdBy: { productMonthlyActive: 'desc' } },
          { createdAt: 'desc' },
        ];
        break;
      default: // relevance — promoted first, then monthly active, then newest
        orderBy = [
          { isPromoted: 'desc' },
          { createdBy: { productMonthlyActive: 'desc' } },
          { createdAt: 'desc' },
        ];
    }

    // Clean up expired promotions on the fly
    await this.prisma.product.updateMany({
      where: {
        isPromoted: true,
        promotedUntil: { lte: now },
      },
      data: {
        isPromoted: false,
        promotedUntil: null,
      },
    });

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        include: {
          seller: true,
          createdBy: {
            select: {
              id: true,
              email: true,
              fullName: true,
              role: true,
              profilePhoto: true,
              garageLogo: true,
              productMonthlyActive: true,
              productMonthlyPlanType: true,
            },
          },
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
        createdBy: {
          select: {
            id: true,
            email: true,
            fullName: true,
            role: true,
            profilePhoto: true,
            garageLogo: true,
            productMonthlyActive: true,
            productMonthlyPlanType: true,
          },
        },
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

  private isProductExpired(product: any, now: Date): boolean {
    if (product.expiresAt) {
      return new Date(product.expiresAt) < now;
    }

    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setHours(0, 0, 0, 0);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const fortyFiveDaysAgo = new Date(now);
    fortyFiveDaysAgo.setHours(0, 0, 0, 0);
    fortyFiveDaysAgo.setDate(fortyFiveDaysAgo.getDate() - 45);

    const sixtyDaysAgo = new Date(now);
    sixtyDaysAgo.setHours(0, 0, 0, 0);
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    const createdAt = new Date(product.createdAt);

    if (product.listingPlan === 'PAY_PER') {
      return createdAt < fortyFiveDaysAgo;
    } else if (
      product.listingPlan === 'MONTHLY_BASIC' ||
      product.listingPlan === 'MONTHLY_PRO' ||
      product.listingPlan === 'MONTHLY_GARAGE'
    ) {
      return createdAt < sixtyDaysAgo;
    } else {
      return createdAt < thirtyDaysAgo;
    }
  }

  // my products
  async findMyProducts(
    userId: string,
    query?: {
      page?: number;
      limit?: number;
      search?: string;
      categoryId?: string;
      condition?: string;
      status?: string;
      stock?: string;
      minPrice?: number | string;
      maxPrice?: number | string;
      sortBy?: string;
    },
  ) {
    // 1. Fetch all products from DB for this user
    const allProducts = await this.prisma.product.findMany({
      where: { createdById: userId },
      include: {
        seller: true,
        createdBy: {
          select: {
            id: true,
            email: true,
            fullName: true,
            role: true,
            profilePhoto: true,
            garageLogo: true,
            productMonthlyActive: true,
            productMonthlyPlanType: true,
          },
        },
        category: true,
      },
    });

    // If page and limit are undefined, return the array directly for backward compatibility
    if (query?.page === undefined && query?.limit === undefined) {
      return allProducts;
    }

    const page = Number(query?.page) || 1;
    const limit = Number(query?.limit) || 10;

    // 2. Filter in-memory
    const filtered = allProducts.filter((product) => {
      const matchesSearch =
        !query?.search ||
        product.partName.toLowerCase().includes(query.search.toLowerCase()) ||
        (product.brand?.toLowerCase() || '').includes(
          query.search.toLowerCase(),
        ) ||
        (product.description?.toLowerCase() || '').includes(
          query.search.toLowerCase(),
        );

      const now = new Date();
      const expired = this.isProductExpired(product, now);

      let matchesStatus = false;
      const qStatus = query?.status?.toLowerCase();

      if (!qStatus || qStatus === 'all') {
        matchesStatus = product.status !== 'DRAFT' && !expired;
      } else if (qStatus === 'expired') {
        matchesStatus = product.status === 'APPROVED' && expired;
      } else if (qStatus === 'approved') {
        matchesStatus = product.status === 'APPROVED' && !expired;
      } else {
        matchesStatus = product.status.toLowerCase() === qStatus;
      }

      const matchesCondition =
        !query?.condition ||
        query.condition === 'all' ||
        product.condition.toLowerCase() === query.condition.toLowerCase();

      const matchesStock =
        !query?.stock ||
        query.stock === 'all' ||
        (query.stock === 'instock' && product.quantity > 0) ||
        (query.stock === 'outofstock' && product.quantity === 0);

      const matchesCategory =
        !query?.categoryId ||
        query.categoryId === 'all' ||
        product.categoryId === query.categoryId;

      const priceNum = Number(product.price) || 0;
      const matchesMinPrice =
        !query?.minPrice || priceNum >= Number(query.minPrice);
      const matchesMaxPrice =
        !query?.maxPrice || priceNum <= Number(query.maxPrice);

      return (
        matchesSearch &&
        matchesStatus &&
        matchesCondition &&
        matchesStock &&
        matchesCategory &&
        matchesMinPrice &&
        matchesMaxPrice
      );
    });

    // 3. Sort in-memory
    filtered.sort((a, b) => {
      if (query?.sortBy === 'newest') {
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      }
      if (query?.sortBy === 'oldest') {
        return (
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
      }
      if (query?.sortBy === 'price_asc') {
        return (Number(a.price) || 0) - (Number(b.price) || 0);
      }
      if (query?.sortBy === 'price_desc') {
        return (Number(b.price) || 0) - (Number(a.price) || 0);
      }
      if (query?.sortBy === 'most_viewed' || query?.sortBy === 'views_desc') {
        return (b.views || 0) - (a.views || 0);
      }
      if (query?.sortBy === 'views_asc') {
        return (a.views || 0) - (b.views || 0);
      }
      if (
        query?.sortBy === 'most_inquiries' ||
        query?.sortBy === 'inquiries_desc'
      ) {
        return (b.inquiries || 0) - (a.inquiries || 0);
      }
      if (query?.sortBy === 'inquiries_asc') {
        return (a.inquiries || 0) - (b.inquiries || 0);
      }
      if (query?.sortBy === 'brand_asc') {
        return (a.brand || '').localeCompare(b.brand || '');
      }
      if (query?.sortBy === 'brand_desc') {
        return (b.brand || '').localeCompare(a.brand || '');
      }
      if (query?.sortBy === 'partName_asc') {
        return a.partName.localeCompare(b.partName);
      }
      if (query?.sortBy === 'partName_desc') {
        return b.partName.localeCompare(a.partName);
      }
      if (query?.sortBy === 'category_asc') {
        return (a.category?.name || '').localeCompare(b.category?.name || '');
      }
      if (query?.sortBy === 'category_desc') {
        return (b.category?.name || '').localeCompare(a.category?.name || '');
      }
      if (query?.sortBy === 'condition_asc') {
        return a.condition.localeCompare(b.condition);
      }
      if (query?.sortBy === 'condition_desc') {
        return b.condition.localeCompare(a.condition);
      }
      if (query?.sortBy === 'quantity_asc') {
        return a.quantity - b.quantity;
      }
      if (query?.sortBy === 'quantity_desc') {
        return b.quantity - a.quantity;
      }
      if (query?.sortBy === 'status_asc') {
        return a.status.localeCompare(b.status);
      }
      if (query?.sortBy === 'status_desc') {
        return b.status.localeCompare(a.status);
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    // 4. Paginate
    const total = filtered.length;
    const skip = (page - 1) * limit;
    const paginatedProducts = filtered.slice(skip, skip + limit);

    return {
      success: true,
      message: 'Products fetched successfully',
      data: paginatedProducts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
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

    const dto = updateProductDto as any;

    const wasDraft = product.status === 'DRAFT';
    const isPublishing = wasDraft && dto.status === 'PENDING';

    if (isPublishing) {
      const paymentConfig = await this.prisma.paymentConfigure.findFirst();
      if (!paymentConfig) {
        throw new InternalServerErrorException(
          'Platform payment configuration missing!',
        );
      }
      const perPerListingPrice = Number(paymentConfig?.perListingPrice || 0);
      const sparePartsMonthlySubscription = Number(
        paymentConfig?.sparePartsMonthly || 0,
      );

      const plan = dto.plan || product.listingPlan || 'PAY_PER';
      const userId = product.createdById;

      const targetGarageId = dto.garageId || product.garageId;
      // Security Check: If listing under a garage, verify the garage ownership
      if (targetGarageId) {
        const garage = await this.prisma.garage.findUnique({
          where: { id: targetGarageId },
        });
        if (!garage || garage.userId !== userId) {
          throw new BadRequestException(
            'Invalid garage specified or garage does not belong to you.',
          );
        }
      }

      const canUseFreeSlot =
        await this.paymentService.canCreateFreeProduct(userId);
      const hasPayPerCredit =
        await this.paymentService.hasProductCreationCredits(userId);
      const hasProductMonthlyPlan =
        await this.paymentService.hasActiveProductMonthly(userId);
      const hasGarageMonthlyPlan =
        await this.paymentService.hasActiveMonthlySubscription(
          userId,
          targetGarageId || undefined,
        );

      const limitUser = await this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          productMonthlyPlanType: true,
          productMonthlyStartDate: true,
        },
      });

      let isBasicLimitExceeded = false;
      if (
        hasProductMonthlyPlan &&
        limitUser?.productMonthlyPlanType === 'BASIC'
      ) {
        const activeProductsCount = await this.prisma.product.count({
          where: {
            createdById: userId,
            createdAt: {
              gte: limitUser.productMonthlyStartDate ?? new Date(0),
            },
          },
        });
        if (activeProductsCount >= 10) {
          isBasicLimitExceeded = true;
        }
      }

      const canCreateWithoutPayment =
        canUseFreeSlot ||
        hasPayPerCredit ||
        (hasProductMonthlyPlan && !isBasicLimitExceeded) ||
        hasGarageMonthlyPlan;

      if (
        ((hasProductMonthlyPlan && !isBasicLimitExceeded) ||
          hasGarageMonthlyPlan) &&
        plan === 'PAY_PER'
      ) {
        throw new BadRequestException({
          message:
            'You have an active Monthly subscription. Cannot use PAY_PER plan.',
          code: 'INVALID_PLAN_SELECTION',
        });
      }

      if (isBasicLimitExceeded && plan === 'MONTHLY') {
        if (!hasPayPerCredit) {
          throw new BadRequestException({
            message:
              'You have reached the limit of 10 listings for your Basic Plan. You must pay 9 AED to add more listings.',
            code: 'BASIC_PLAN_LIMIT_EXCEEDED',
            amount: 9,
            plan: 'PAY_PER',
          });
        }
      }

      if (!canCreateWithoutPayment) {
        if (plan === 'PAY_PER') {
          throw new BadRequestException({
            message: `${perPerListingPrice}$ Pay-Per payment required to publish this product`,
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
          'Free limit exceeded. Payment or subscription required to publish draft.',
        );
      }

      // Consume free slot if used
      if (canUseFreeSlot) {
        await this.paymentService.incrementFreeProductCount(userId);
      }

      // Consume pay-per-product credit if used
      if (
        hasPayPerCredit &&
        !canUseFreeSlot &&
        (!hasProductMonthlyPlan || isBasicLimitExceeded)
      ) {
        await this.paymentService.useProductCreationCredit(userId);
      }
    }

    delete dto.promotedDuration;
    delete dto.photos;
    delete dto.verificationImage;

    const {
      sellerName,
      sellerEmail,
      sellerPhoneNumber,
      sellerType,
      ...productData
    } = dto;
    if (
      productData.garageId === 'null' ||
      productData.garageId === 'none' ||
      productData.garageId === ''
    ) {
      productData.garageId = null;
    }

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

    if (updateData.status === 'PENDING') {
      const expiresAt = new Date();
      const plan = updateData.listingPlan || product.listingPlan;
      if (plan === 'PAY_PER') {
        expiresAt.setDate(expiresAt.getDate() + 15);
      } else if (plan === 'MONTHLY_BASIC') {
        expiresAt.setDate(expiresAt.getDate() + 15);
      } else if (plan === 'MONTHLY_PRO' || plan === 'MONTHLY_GARAGE') {
        expiresAt.setDate(expiresAt.getDate() + 30);
      } else {
        // Free plan
        expiresAt.setDate(expiresAt.getDate() + 15);
      }
      updateData.expiresAt = expiresAt;
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
            role: true,
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

    const draftProduct = await this.prisma.product.update({
      where: { id },
      data: { status: 'DRAFT' },
      include: {
        seller: true,
        createdBy: {
          select: {
            id: true,
            email: true,
            fullName: true,
            role: true,
          },
        },
        category: true,
      },
    });

    return {
      message: 'Product moved to drafts successfully',
      product: draftProduct,
    };
  }

  @HandleError('Failed to permanently delete product')
  async removePermanently(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    // Delete photos from S3
    if (product.photos && product.photos.length > 0) {
      await Promise.all(
        product.photos.map((photoUrl) =>
          (this.s3FileService as any).deleteFile(photoUrl),
        ),
      ).catch((e) =>
        console.error('S3 Deletion during permanent DELETE Failed:', e),
      );
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
            role: true,
          },
        },
        category: true,
      },
    });

    return {
      message: 'Product deleted permanently successfully',
      product: deletedProduct,
    };
  }

  // User limit status (now shows both Garage & Product Monthly plans)
  async getUserProductLimit(userId: string, garageId?: string) {
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
        isSubscribed: true,
        subscriptionEndDate: true,
        isSubscriptionTrialActive: true,
        subscriptionTrialEndDate: true,
        productMonthlyActive: true,
        productMonthlyEndDate: true,
        productMonthlyStartDate: true,
        promotionCredits: true,
        productMonthlyPlanType: true,
        productMonthlyPendingPlanType: true,
        productMonthlyCancelAtPeriodEnd: true,
      },
    });

    if (!user) {
      return {
        freeProductsUsed: 0,
        freeProductsRemaining: freePromotionalListings,
        productCredits: 0,
        hasGarageMonthly: false,
        hasProductMonthly: false,
        productMonthlyPlanType: null,
        productMonthlyPendingPlanType: null,
        productMonthlyCancelAtPeriodEnd: false,
        basicListingsUsed: 0,
        basicListingsLimit: 10,
      };
    }

    const freeUsed = user.freeProductsUsed || 0;
    const credits = user.freeProductsListing || 0;
    const promotionCredits = user.promotionCredits || 0;

    const now = new Date();

    if (
      user.productMonthlyActive &&
      user.productMonthlyEndDate &&
      new Date(user.productMonthlyEndDate) <= now
    ) {
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          productMonthlyActive: false,
          productMonthlyPendingPlanType: null,
          productMonthlyCancelAtPeriodEnd: false,
        },
      });
      user.productMonthlyActive = false;
      user.productMonthlyPendingPlanType = null;
      user.productMonthlyCancelAtPeriodEnd = false;
    }

    const hasGarageMonthly =
      await this.paymentService.hasActiveMonthlySubscription(
        userId,
        garageId || undefined,
      );

    const hasProductMonthly = Boolean(
      user.productMonthlyActive &&
      user.productMonthlyEndDate &&
      new Date(user.productMonthlyEndDate) > now,
    );

    let basicListingsUsed = 0;
    if (hasProductMonthly && user.productMonthlyPlanType === 'BASIC') {
      basicListingsUsed = await this.prisma.product.count({
        where: {
          createdById: userId,
          createdAt: {
            gte: user.productMonthlyStartDate ?? new Date(0),
          },
        },
      });
    }

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
      productMonthlyPlanType: user.productMonthlyPlanType,
      productMonthlyPendingPlanType: user.productMonthlyPendingPlanType,
      productMonthlyCancelAtPeriodEnd: user.productMonthlyCancelAtPeriodEnd,
      basicListingsUsed,
      basicListingsLimit: 10,
    };
  }

  async getProductStats(query?: { search?: string; userId?: string }) {
    const where: any = {
      status: 'APPROVED',
    };

    const now = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setHours(0, 0, 0, 0);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const fortyFiveDaysAgo = new Date();
    fortyFiveDaysAgo.setHours(0, 0, 0, 0);
    fortyFiveDaysAgo.setDate(fortyFiveDaysAgo.getDate() - 45);

    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setHours(0, 0, 0, 0);
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    const andConditions: any[] = [];

    // Expiry / active listings filter (same logic as findAll)
    andConditions.push({
      OR: [
        {
          expiresAt: { gte: now },
        },
        {
          expiresAt: null,
          OR: [
            {
              listingPlan: 'PAY_PER',
              createdAt: { gte: fortyFiveDaysAgo },
            },
            {
              listingPlan: {
                in: ['MONTHLY_BASIC', 'MONTHLY_PRO', 'MONTHLY_GARAGE'],
              },
              createdAt: { gte: sixtyDaysAgo },
            },
            {
              listingPlan: {
                notIn: [
                  'PAY_PER',
                  'MONTHLY_BASIC',
                  'MONTHLY_PRO',
                  'MONTHLY_GARAGE',
                ],
              },
              createdAt: { gte: thirtyDaysAgo },
            },
            {
              listingPlan: null,
              createdAt: { gte: thirtyDaysAgo },
            },
          ],
        },
      ],
    });

    if (query?.search) {
      andConditions.push({
        OR: [
          { partName: { contains: query.search, mode: 'insensitive' } },
          { description: { contains: query.search, mode: 'insensitive' } },
          { brand: { contains: query.search, mode: 'insensitive' } },
        ],
      });
    }

    if (query?.userId) {
      where.createdById = query.userId;
    }

    where.AND = andConditions;

    // Get product counts grouped by category ID
    const categoryStats = await this.prisma.product.groupBy({
      by: ['categoryId'],
      where,
      _count: {
        id: true,
      },
    });

    // Get product counts grouped by condition
    const conditionStats = await this.prisma.product.groupBy({
      by: ['condition'],
      where,
      _count: {
        id: true,
      },
    });

    // Fetch categories to map ID to name
    const categories = await this.prisma.partsCategory.findMany({
      select: {
        id: true,
        name: true,
      },
    });

    const categoryMap = categories.reduce(
      (acc, cat) => {
        acc[cat.id] = cat.name;
        return acc;
      },
      {} as Record<string, string>,
    );

    const categoryCounts: Record<string, number> = {};
    categories.forEach((cat) => {
      categoryCounts[cat.name] = 0;
    });

    categoryStats.forEach((stat) => {
      const catName = categoryMap[stat.categoryId];
      if (catName) {
        categoryCounts[catName] = stat._count.id;
      }
    });

    const conditionCounts: Record<string, number> = {
      New: 0,
      Used: 0,
      Refurbished: 0,
    };

    conditionStats.forEach((stat) => {
      const label = stat.condition;
      if (label) {
        const matchingKey = Object.keys(conditionCounts).find(
          (k) => k.toLowerCase() === label.toLowerCase(),
        );
        if (matchingKey) {
          conditionCounts[matchingKey] = stat._count.id;
        }
      }
    });

    const promotedCount = await this.prisma.product.count({
      where: {
        ...where,
        isPromoted: true,
      },
    });

    return {
      success: true,
      data: {
        categories: categoryCounts,
        conditions: conditionCounts,
        promoted: promotedCount,
      },
    };
  }

  async getActiveSellers() {
    const activeProducts = await this.prisma.product.findMany({
      where: {
        status: 'APPROVED',
      },
      select: {
        createdBy: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
    });

    const uniqueUsersMap = new Map<string, { id: string; fullName: string }>();
    activeProducts.forEach((product) => {
      if (product.createdBy) {
        uniqueUsersMap.set(product.createdBy.id, {
          id: product.createdBy.id,
          fullName: product.createdBy.fullName || 'Unknown',
        });
      }
    });

    const sellers = Array.from(uniqueUsersMap.values());

    return {
      success: true,
      data: sellers,
    };
  }
}
