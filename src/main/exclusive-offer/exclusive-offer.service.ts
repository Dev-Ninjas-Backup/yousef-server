import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/lib/prisma/prisma.service';
import { CreateExclusiveOfferDto } from './dto/create-exclusive-offer.dto';
import { UpdateExclusiveOfferDto } from './dto/update-exclusive-offer.dto';
import { HandleError } from 'src/common/error/handle-error.decorator';
import { AppError } from 'src/common/error/handle-error.app';
import {
  successResponse,
  TResponse,
} from 'src/common/utilsResponse/response.util';

@Injectable()
export class ExclusiveOfferService {
  constructor(private readonly prisma: PrismaService) {}

  @HandleError('Failed to create exclusive offer', 'ExclusiveOffer')
  async create(
    dto: CreateExclusiveOfferDto,
    bannerImage: string,
  ): Promise<TResponse<any>> {
    const offer = await this.prisma.exclusiveOffer.create({
      data: {
        title: dto.title,
        description: dto.description,
        validUnit: dto.validUnit,
        bannerImage,
        originalPrice: dto.originalPrice || null,
        price: dto.price || null,
        brand: dto.brand || null,
        garageId: dto.garageId || null,
      },
    });
    return successResponse(offer, 'Exclusive offer created successfully');
  }

  @HandleError('Failed to fetch exclusive offers', 'ExclusiveOffer')
  async findAll(): Promise<TResponse<any[]>> {
    const offers = await this.prisma.exclusiveOffer.findMany({
      orderBy: { id: 'desc' }, // or any field
    });
    return successResponse(offers, 'Exclusive offers fetched successfully');
  }

  @HandleError('Failed to fetch exclusive offer details', 'ExclusiveOffer')
  async findOne(id: string): Promise<TResponse<any>> {
    const offer = await this.prisma.exclusiveOffer.findUnique({
      where: { id },
    });
    if (!offer) {
      throw new AppError(404, 'Exclusive offer not found');
    }
    return successResponse(
      offer,
      'Exclusive offer details fetched successfully',
    );
  }

  @HandleError('Failed to update exclusive offer', 'ExclusiveOffer')
  async update(
    id: string,
    dto: UpdateExclusiveOfferDto,
    bannerImage?: string,
  ): Promise<TResponse<any>> {
    // Check if exists
    await this.findOne(id);

    const data: any = { ...dto };
    if (bannerImage) {
      data.bannerImage = bannerImage;
    }

    const updated = await this.prisma.exclusiveOffer.update({
      where: { id },
      data,
    });
    return successResponse(updated, 'Exclusive offer updated successfully');
  }

  @HandleError('Failed to delete exclusive offer', 'ExclusiveOffer')
  async remove(id: string): Promise<TResponse<any>> {
    // Check if exists
    await this.findOne(id);

    await this.prisma.exclusiveOffer.delete({
      where: { id },
    });
    return successResponse(null, 'Exclusive offer deleted successfully');
  }
}
