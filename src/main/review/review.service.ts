import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { HandleError } from 'src/common/error/handle-error.decorator';
import { successResponse } from 'src/common/utilsResponse/response.util';
import { PrismaService } from 'src/lib/prisma/prisma.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';

@Injectable()
export class ReviewService {
  constructor(private prisma: PrismaService) {}

  @HandleError('Failed to create review', 'Review')
  async create(
    garageId: string,
    createReviewDto: CreateReviewDto,
    userId: string,
  ) {
    if (!userId) {
      throw new BadRequestException('User ID is required');
    }

    const garage = await this.prisma.garage.findUnique({
      where: { id: garageId },
    });
    if (!garage) {
      throw new NotFoundException('Garage not found');
    }

    const existingReview = await this.prisma.review.findFirst({
      where: { userId, garageId },
    });

    if (existingReview) {
      const updatedReview = await this.prisma.review.update({
        where: { id: existingReview.id },
        data: createReviewDto,
        include: {
          user: { select: { id: true, fullName: true, profilePhoto: true } },
          garage: { select: { id: true, name: true } },
        },
      });
      return successResponse(updatedReview, 'Review updated successfully');
    }

    const review = await this.prisma.review.create({
      data: {
        ...createReviewDto,
        userId,
        garageId,
      },
      include: {
        user: { select: { id: true, fullName: true, profilePhoto: true } },
        garage: { select: { id: true, name: true } },
      },
    });
    return successResponse(review, 'Review created successfully');
  }

  @HandleError('Failed to fetch reviews', 'Review')
  async findByGarage(garageId: string, query: any) {
    const { page = 1, limit = 10, rating, search } = query;
    const skip = (page - 1) * limit;

    const where: any = { garageId };
    if (rating) {
      where.rating = rating;
    }
    if (search) {
      where.comment = {
        contains: search,
        mode: 'insensitive',
      };
    }

    const [reviews, total] = await Promise.all([
      this.prisma.review.findMany({
        where,
        include: {
          user: { select: { id: true, fullName: true, profilePhoto: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.review.count({ where }),
    ]);

    return successResponse(
      {
        reviews,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      },
      'Reviews fetched successfully',
    );
  }

  @HandleError('Failed to fetch user reviews', 'Review')
  async findByUser(userId: string, query: any) {
    const { page = 1, limit = 10, rating, search } = query;
    const skip = (page - 1) * limit;

    const where: any = { userId };
    if (rating) {
      where.rating = rating;
    }
    if (search) {
      where.comment = {
        contains: search,
        mode: 'insensitive',
      };
    }

    const [reviews, total] = await Promise.all([
      this.prisma.review.findMany({
        where,
        include: {
          garage: { select: { id: true, name: true, profileImage: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.review.count({ where }),
    ]);

    return successResponse(
      {
        reviews,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      },
      'User reviews fetched successfully',
    );
  }

  @HandleError('Failed to fetch review', 'Review')
  async findOne(id: string) {
    const review = await this.prisma.review.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, fullName: true, profilePhoto: true } },
        garage: { select: { id: true, name: true, profileImage: true } },
      },
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    return successResponse(review, 'Review fetched successfully');
  }

  @HandleError('Failed to update review', 'Review')
  async update(id: string, updateReviewDto: UpdateReviewDto, userId: string) {
    const review = await this.prisma.review.findUnique({ where: { id } });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    if (review.userId !== userId) {
      throw new ForbiddenException('You can only update your own reviews');
    }

    const updatedReview = await this.prisma.review.update({
      where: { id },
      data: updateReviewDto,
      include: {
        user: { select: { id: true, fullName: true, profilePhoto: true } },
        garage: { select: { id: true, name: true } },
      },
    });

    return successResponse(updatedReview, 'Review updated successfully');
  }

  @HandleError('Failed to delete review', 'Review')
  async remove(id: string, userId: string) {
    const review = await this.prisma.review.findUnique({ where: { id } });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    if (review.userId !== userId) {
      throw new ForbiddenException('You can only delete your own reviews');
    }

    await this.prisma.review.delete({ where: { id } });
    return successResponse(null, 'Review deleted successfully');
  }

  @HandleError('Failed to fetch garage statistics', 'Review')
  async getGarageStats(garageId: string) {
    const garage = await this.prisma.garage.findUnique({
      where: { id: garageId },
    });
    if (!garage) {
      throw new NotFoundException('Garage not found');
    }

    const [totalReviews, ratingStats] = await Promise.all([
      this.prisma.review.count({ where: { garageId } }),
      this.prisma.review.groupBy({
        by: ['rating'],
        where: { garageId },
        _count: { rating: true },
      }),
    ]);

    const averageRating = await this.prisma.review.aggregate({
      where: { garageId },
      _avg: { rating: true },
    });

    const ratingDistribution = {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
    };

    ratingStats.forEach((stat) => {
      ratingDistribution[stat.rating] = stat._count.rating;
    });

    return successResponse(
      {
        totalReviews,
        averageRating: averageRating._avg.rating || 0,
        ratingDistribution,
      },
      'Garage statistics fetched successfully',
    );
  }
}
