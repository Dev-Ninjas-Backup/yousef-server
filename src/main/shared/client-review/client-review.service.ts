import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { HandleError } from 'src/common/error/handle-error.decorator';
import { PrismaService } from 'src/lib/prisma/prisma.service';
import { CreateClientReviewDto } from './dto/create-client-review.dto';
import { UpdateClientReviewDto } from './dto/update-client-review.dto';

@Injectable()
export class ClientReviewService {
  constructor(private readonly prisma: PrismaService) {}

  @HandleError('Error Creating Client Review')
  async createClientReview(dto: CreateClientReviewDto, userId: string) {
    const CreateReview = await this.prisma.clientReview.create({
      data: {
        reviewText: dto.reviewText,
        rating: dto.rating,
        userId: userId,
      },
    });
    return {
      message: 'Client Review Created Successfully',
      data: CreateReview,
    };
  }

  @HandleError('Error Fetching Client Reviews')
  async findAll() {
    return await this.prisma.clientReview.findMany({
      include: {
        user: {
          select: {
            userLat: true,
            userLng: true,
            id: true,
            fullName: true,
            email: true,
            isActive: true,
            role: true,
            profilePhoto: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  @HandleError('Error Fetching Client Review')
  async findOne(id: string) {
    const review = await this.prisma.clientReview.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            userLat: true,
            userLng: true,
            id: true,
            fullName: true,
            email: true,
            isActive: true,
            role: true,
            profilePhoto: true,
          },
        },
      },
    });

    if (!review) {
      throw new NotFoundException(`Client review with ID ${id} not found`);
    }

    return review;
  }

  @HandleError('Error Updating Client Review')
  async update(id: string, dto: UpdateClientReviewDto, userId: string) {
    const review = await this.prisma.clientReview.findUnique({
      where: { id },
    });

    if (!review) {
      throw new NotFoundException(`Client review with ID ${id} not found`);
    }

    if (review.userId !== userId) {
      throw new ForbiddenException('You can only update your own reviews');
    }

    return await this.prisma.clientReview.update({
      where: { id },
      data: dto,
      include: {
        user: {
          select: {
            userLat: true,
            userLng: true,
            id: true,
            fullName: true,
            email: true,
            isActive: true,
            role: true,
            profilePhoto: true,
          },
        },
      },
    });
  }

  @HandleError('Error Deleting Client Review')
  async removeSpecific(id: string, userId: string) {
    const review = await this.prisma.clientReview.findUnique({
      where: { id },
    });

    if (!review) {
      throw new NotFoundException(`Client review with ID ${id} not found`);
    }

    if (review.userId !== userId) {
      throw new ForbiddenException('You can only delete your own reviews');
    }

    await this.prisma.clientReview.delete({
      where: { id },
    });

    return { message: 'Client review deleted successfully' };
  }

  @HandleError('Error Deleting All Client Reviews')
  async removeReviewAdmin(id: string) {
    await this.prisma.clientReview.delete({
      where: { id },
    });

    return { message: 'All client reviews for the user deleted successfully' };
  }
}
