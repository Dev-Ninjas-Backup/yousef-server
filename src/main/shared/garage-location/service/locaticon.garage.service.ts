import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';

import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { PrismaService } from 'src/lib/prisma/prisma.service';
import { NearbyGarageQueryDto } from '../dto/nearby-garage.dto';

export interface GarageWithDistance {
  id: string;
  name: string;
  coverPhoto: string | null;
  profileImage: string | null;
  garagePhone: string | null;
  email: string | null;
  street: string | null;
  city: string | null;
  emirate: string | null;
  address: string | null;
  garageLat: number | null;
  garageLng: number | null;
  description: string | null;
  certifications: string[];
  weekdaysHours: string | null;
  weekendsHours: string | null;
  brandExpertise: string[];
  distance: number;
  user: {
    fullName: string | null;
    phone: string | null;
  };
  services: {
    service: {
      id: string;
      name: string;
      icon: string;
    };
  }[];
  reviews: {
    id: string;
    rating: number;
    comment: string | null;
  }[];
  averageRating: number;
  totalReviews: number;
}

@Injectable()
export class LocationgarageService {
  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {}

  /**
   * Calculate distance between two coordinates using Haversine formula
   * Returns distance in kilometers
   */
  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const R = 6371;
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) *
        Math.cos(this.toRadians(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Geocode address using Google Maps API
   */
  private async geocodeAddress(
    address: string,
  ): Promise<{ lat: number; lng: number }> {
    const apiKey = this.configService.get<string>('GOOGLE_MAPS_API_KEY');

    if (!apiKey) {
      throw new HttpException(
        'Google Maps API key not configured',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    try {
      const response = await axios.get(
        'https://maps.googleapis.com/maps/api/geocode/json',
        {
          params: {
            address,
            key: apiKey,
          },
        },
      );

      const data = response.data as any;
      if (data.status !== 'OK' || !data.results.length) {
        throw new BadRequestException('Unable to geocode the provided address');
      }

      const location = data.results[0].geometry.location;
      return {
        lat: location.lat,
        lng: location.lng,
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new HttpException(
        'Error geocoding address',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Find nearby garages based on coordinates or address
   */
  async findNearbyGarages(query: NearbyGarageQueryDto) {
    let searchLat: number;
    let searchLng: number;

    // Get coordinates from address or use provided lat/lng
    if (query.address) {
      const geocoded = await this.geocodeAddress(query.address);
      searchLat = geocoded.lat;
      searchLng = geocoded.lng;
    } else if (query.lat && query.lng) {
      searchLat = query.lat;
      searchLng = query.lng;
    } else {
      throw new BadRequestException(
        'Either coordinates (lat, lng) or address must be provided',
      );
    }

    const radius = query.radius || 10;

    // Fetch all garages with coordinates
    const garages = await this.prisma.garage.findMany({
      where: {
        garageLat: { not: null },
        garageLng: { not: null },
        user: {
          isActive: true,
          isDeleted: false,
          garageStatus: 'APPROVE',
        },
      },
      include: {
        user: {
          select: {
            fullName: true,
            phone: true,
          },
        },
        services: {
          include: {
            service: {
              select: {
                id: true,
                name: true,
                icon: true,
              },
            },
          },
        },
        reviews: {
          select: {
            id: true,
            rating: true,
            comment: true,
          },
        },
      },
    });

    // Calculate distances and filter by radius
    const garagesWithDistance: GarageWithDistance[] = garages
      .map((garage) => {
        const distance = this.calculateDistance(
          searchLat,
          searchLng,
          garage.garageLat!,
          garage.garageLng!,
        );

        // Calculate average rating
        const totalRating = garage.reviews.reduce(
          (sum, review) => sum + review.rating,
          0,
        );
        const averageRating =
          garage.reviews.length > 0 ? totalRating / garage.reviews.length : 0;

        return {
          ...garage,
          distance: parseFloat(distance.toFixed(2)),
          averageRating: parseFloat(averageRating.toFixed(1)),
          totalReviews: garage.reviews.length,
        };
      })
      .filter((garage) => garage.distance <= radius)
      .sort((a, b) => a.distance - b.distance);

    // Pagination
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;
    const paginatedGarages = garagesWithDistance.slice(skip, skip + limit);

    return {
      success: true,
      data: {
        garages: paginatedGarages,
        searchLocation: {
          lat: searchLat,
          lng: searchLng,
          address: query.address || null,
        },
        pagination: {
          total: garagesWithDistance.length,
          page,
          limit,
          totalPages: Math.ceil(garagesWithDistance.length / limit),
        },
        radius: radius,
      },
    };
  }

  /**
   * Get garage details by ID with distance from user location
   */
  async getGarageById(garageId: string, userLat?: number, userLng?: number) {
    const garage = await this.prisma.garage.findUnique({
      where: { id: garageId },
      include: {
        user: {
          select: {
            fullName: true,
            phone: true,
            email: true,
          },
        },
        services: {
          include: {
            service: true,
          },
        },
        reviews: {
          include: {
            user: {
              select: {
                fullName: true,
                profilePhoto: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!garage) {
      throw new BadRequestException('Garage not found');
    }

    let distance: number | null = null;

    if (userLat && userLng && garage.garageLat && garage.garageLng) {
      distance = parseFloat(
        this.calculateDistance(
          userLat,
          userLng,
          garage.garageLat,
          garage.garageLng,
        ).toFixed(2),
      );
    }

    const totalRating = garage.reviews.reduce(
      (sum, review) => sum + review.rating,
      0,
    );
    const averageRating =
      garage.reviews.length > 0
        ? parseFloat((totalRating / garage.reviews.length).toFixed(1))
        : 0;

    return {
      success: true,
      data: {
        ...garage,
        distance,
        averageRating,
        totalReviews: garage.reviews.length,
      },
    };
  }
}
