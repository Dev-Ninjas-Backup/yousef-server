import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../lib/prisma/prisma.service';
import { S3FileService } from '../../../lib/s3file/s3file.service';
import { CreatePromotionalAdDto } from './dto/create-promotional-ad.dto';
import { UpdatePromotionalAdDto } from './dto/update-promotional-ad.dto';

@Injectable()
export class PromotionalAdService {
  constructor(
    private prisma: PrismaService,
    private s3FileService: S3FileService,
  ) { }

  // async create(
  //   createDto: CreatePromotionalAdDto,
  //   files?: Express.Multer.File[],
  // ) {
  //   const imageUrls: string[] = [];

  //   // Handle file uploads
  //   if (files?.length) {
  //     for (const file of files) {
  //       const result = await this.s3FileService.processUploadedFile(file);
  //       imageUrls.push(result.url);
  //     }
  //   }

  //   // Handle direct URLs
  //   if (createDto.imageUrl?.length) {
  //     imageUrls.push(...createDto.imageUrl);
  //   }

  //   return this.prisma.promotion.create({
  //     data: {
  //       ...createDto,
  //       imageUrl: imageUrls,
  //       discount: createDto.discount
  //         ? parseFloat(createDto.discount)
  //         : undefined,
  //       validFrom: new Date(createDto.validFrom),
  //       validUntil: new Date(createDto.validUntil),
  //     },
  //     include: {
  //       user: {
  //         select: {
  //           id: true,
  //           email: true,
  //           fullName: true,
  //           bio: true,
  //           phone: true,
  //           profilePhoto: true,
  //           address: true,
  //           city: true,
  //           garageName: true,
  //         },
  //       },
  //       product: true,
  //     },
  //   });
  // }


  async create(
    createDto: CreatePromotionalAdDto & { userId: string },
    files?: Express.Multer.File[],
  ) {
    const { userId, paymentIntentId, ...rest } = createDto;

    let quota = await this.prisma.garagePromotionQuota.findUnique({
      where: { garageId: userId },
    });

    if (!quota) {
      quota = await this.prisma.garagePromotionQuota.create({
        data: { garageId: userId },
      });
    }

    const isFreeAvailable = quota.freeListingsUsed < quota.freeListingsTotal;
    const isPaid = !!paymentIntentId || !isFreeAvailable;


    if (isPaid && !paymentIntentId) {
      throw new BadRequestException(
        'You have used all free listings. Payment is required (20 AED).',
      );
    }

    // verify payment
    // if (paymentIntentId) {
    //   const paymentVerified = await this.verifyPayment(paymentIntentId);
    //   if (!paymentVerified || paymentVerified.amount !== 20_00) { // 20 AED = 2000 fils
    //     throw new BadRequestException('Invalid payment');
    //   }
    // }


    const imageUrls: string[] = [];
    if (files?.length) {
      for (const file of files) {
        const result = await this.s3FileService.processUploadedFile(file);
        imageUrls.push(result.url);
      }
    }
    if (createDto.imageUrl?.length) {
      imageUrls.push(...createDto.imageUrl);
    }


    const promotion = await this.prisma.promotion.create({
      data: {
        ...rest,
        userId,
        imageUrl: imageUrls,
        isFree: isFreeAvailable,
        isPaid: isPaid,
        paymentId: paymentIntentId || null,
        discount: rest.discount ? parseFloat(rest.discount as any) : null,
        validFrom: new Date(rest.validFrom),
        validUntil: new Date(rest.validUntil),
        status: 'PENDING',
      },
      include: {
        user: {
          select: {
            garageName: true
          }
        }, product: true
      },
    });


    if (isFreeAvailable) {
      await this.prisma.garagePromotionQuota.update({
        where: { garageId: userId },
        data: { freeListingsUsed: { increment: 1 } },
      });
    }

    return promotion;
  }

  async findAll(userId?: string) {
    return this.prisma.promotion.findMany({
      where: userId ? { userId } : {},
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
            bio: true,
            phone: true,
            profilePhoto: true,
            address: true,
            city: true,
            garageName: true,
          },
        },
        product: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const promotion = await this.prisma.promotion.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
            bio: true,
            phone: true,
            profilePhoto: true,
            address: true,
            city: true,
            garageName: true,
          },
        },
        product: true,
      },
    });

    if (!promotion) {
      throw new NotFoundException('Promotional ad not found');
    }

    return promotion;
  }

  async update(
    id: string,
    updateDto: UpdatePromotionalAdDto,
    files?: Express.Multer.File[],
  ) {
    const existingPromotion = await this.findOne(id);

    const updateData: any = {};

    // Only update fields that are provided
    if (updateDto.adTitle !== undefined) updateData.adTitle = updateDto.adTitle;
    if (updateDto.description !== undefined)
      updateData.description = updateDto.description;
    if (updateDto.adType !== undefined) updateData.adType = updateDto.adType;
    if (updateDto.location !== undefined)
      updateData.location = updateDto.location;
    if (updateDto.discount !== undefined)
      updateData.discount = parseFloat(updateDto.discount);
    if (updateDto.validFrom !== undefined)
      updateData.validFrom = new Date(updateDto.validFrom);
    if (updateDto.validUntil !== undefined)
      updateData.validUntil = new Date(updateDto.validUntil);

    // Handle images only if provided
    if (files?.length || updateDto.imageUrl?.length) {
      const imageUrls: string[] = [...existingPromotion.imageUrl];

      if (files?.length) {
        for (const file of files) {
          const result = await this.s3FileService.processUploadedFile(file);
          imageUrls.push(result.url);
        }
      }

      if (updateDto.imageUrl?.length) {
        imageUrls.push(...updateDto.imageUrl);
      }

      updateData.imageUrl = imageUrls;
    }

    return this.prisma.promotion.update({
      where: { id },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
            bio: true,
            phone: true,
            profilePhoto: true,
            address: true,
            city: true,
            garageName: true,
          },
        },
        product: true,
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.promotion.delete({ where: { id } });
  }
}
