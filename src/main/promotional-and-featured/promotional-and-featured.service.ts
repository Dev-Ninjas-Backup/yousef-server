import { Injectable } from '@nestjs/common';
import { HandleError } from 'src/common/error/handle-error.decorator';
import { PrismaService } from 'src/lib/prisma/prisma.service';

@Injectable()
export class PromotionalAndFeaturedService {
  constructor(private readonly prisma: PrismaService) {}

  // Get all promotional products last 30 days
  @HandleError('Failed to fetch garages', 'Garage')
  async getPromotionalProducts() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    return this.prisma.product.findMany({
      where: {
        isPromoted: true,
        createdAt: { gte: thirtyDaysAgo },
      },
    });
  }

  // Get top 3 featured garages
  @HandleError('Failed to fetch garages', 'Garage')
  async getFeaturedGarages() {
    const garages = await this.prisma.garage.findMany({
      include: {
        services: {
          select: {
            service: {
              select: {
                id: true,
                name: true,
                icon: true,
              },
            },
          },
        },
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
            bio: true,
            phone: true,
            profilePhoto: true,
            city: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        reviews: {
          where: { isVisible: true },
          select: {
            overallExperience: true,
            serviceQuality: true,
            timeliness: true,
            valueForMoney: true,
          },
        },
      },
    });

    const garagesWithRating = garages.map((garage) => {
      const reviews = garage.reviews;

      const averageRating =
        reviews.length > 0
          ? parseFloat(
              (
                reviews.reduce(
                  (sum, review) =>
                    sum +
                    (review.overallExperience +
                      review.serviceQuality +
                      review.timeliness +
                      review.valueForMoney) /
                      4,
                  0,
                ) / reviews.length
              ).toFixed(1),
            )
          : 0;

      return {
        ...garage,
        averageRating,
        totalReviews: reviews.length,
      };
    });

    const sortedGarages = garagesWithRating
      .sort((a, b) => {
        if (b.averageRating !== a.averageRating) {
          return b.averageRating - a.averageRating;
        }
        return b.totalReviews - a.totalReviews;
      })
      .slice(0, 3);

    const transformedGarages = sortedGarages.map((garage) => ({
      ...garage,
      services: garage.services.map((gs) => gs.service),
      reviews: undefined,
    }));

    return {
      garages: transformedGarages,
      total: transformedGarages.length,
    };
  }
}
