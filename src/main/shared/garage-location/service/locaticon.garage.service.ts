// src/garage-location/service/location.garage.service.ts

import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/lib/prisma/prisma.service';
import { NearbyGarageQueryDto } from '../dto/nearby-garage.dto';

export interface GarageWithDistance {
  id: string;
  name: string;
  garageLat: number;
  garageLng: number;
  distance: number;
  address: string;
  profileImage: string | null;
  averageRating: number;
  totalReviews: number;
  services: { id: string; name: string; icon: string }[];
  isOpenNow: boolean;
}

@Injectable()
export class LocationGarageService {
  constructor(private prisma: PrismaService) {}

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
      Math.sin(dLat / 2) ** 2 +
      Math.cos(this.toRadians(lat1)) *
        Math.cos(this.toRadians(lat2)) *
        Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRadians(deg: number): number {
    return deg * (Math.PI / 180);
  }

  private calculateBoundingBox(lat: number, lng: number, radiusKm: number) {
    const latDelta = radiusKm / 111;
    const lngDelta = radiusKm / (111 * Math.cos(this.toRadians(lat)));
    return {
      minLat: lat - latDelta,
      maxLat: lat + latDelta,
      minLng: lng - lngDelta,
      maxLng: lng + lngDelta,
    };
  }

  private isGarageOpen(
    weekdaysHours: string | null,
    weekendsHours: string | null,
  ): boolean {
    if (!weekdaysHours && !weekendsHours) return false;

    const now = new Date();
    const day = now.getDay();
    const isWeekend = day === 0 || day === 6;
    const hoursStr = isWeekend ? weekendsHours : weekdaysHours;
    if (!hoursStr) return false;

    const match = hoursStr.match(
      /(\d{1,2}):?(\d{0,2})\s*(am|pm)?\s*-\s*(\d{1,2}):?(\d{0,2})\s*(am|pm)?/i,
    );
    if (!match) return false;

    const parseTime = (h: string, m: string, p?: string): number => {
      let hour = parseInt(h);
      const min = parseInt(m || '0');
      if (p?.toLowerCase() === 'pm' && hour !== 12) hour += 12;
      if (p?.toLowerCase() === 'am' && hour === 12) hour = 0;
      return hour + min / 60;
    };

    const open = parseTime(match[1], match[2], match[3]);
    const close = parseTime(match[4], match[5], match[6]);
    const current = now.getHours() + now.getMinutes() / 60;

    return current >= open && current < close;
  }

  async findNearbyGarages(query: NearbyGarageQueryDto): Promise<{
    success: true;
    garages: GarageWithDistance[];
    count: number;
  }> {
    const { lat, lng, radius = 10 } = query;

    if (!lat || !lng) {
      throw new Error('Latitude and longitude are required');
    }

    const bbox = this.calculateBoundingBox(lat, lng, radius + 5);

    const garages = await this.prisma.garage.findMany({
      where: {
        garageLat: { gte: bbox.minLat, lte: bbox.maxLat },
        garageLng: { gte: bbox.minLng, lte: bbox.maxLng },
        user: {
          isActive: true,
          isDeleted: false,
          garageStatus: 'APPROVE',
        },
      },
      include: {
        services: {
          include: {
            service: { select: { id: true, name: true, icon: true } },
          },
        },
        reviews: { select: { overallExperience: true } },
      },
      take: 100,
    });

    const result = garages
      .map((garage) => {
        const distance = this.calculateDistance(
          lat,
          lng,
          garage.garageLat!,
          garage.garageLng!,
        );
        if (distance > radius) return null;

        const totalRating = (garage as any).reviews.reduce(
          (sum: number, r: any) => sum + r.overallExperience,
          0,
        );
        const averageRating = (garage as any).reviews.length
          ? totalRating / (garage as any).reviews.length
          : 0;

        return {
          id: garage.id,
          name: garage.name,
          garageLat: garage.garageLat!,
          garageLng: garage.garageLng!,
          distance: Number(distance.toFixed(2)),
          address: garage.address,
          profileImage: garage.profileImage,
          averageRating: Number(averageRating.toFixed(1)),
          totalReviews: (garage as any).reviews.length,
          services: (garage as any).services.map((gs: any) => gs.service),
          isOpenNow: this.isGarageOpen(
            garage.weekdaysHours,
            garage.weekendsHours,
          ),
        };
      })
      .filter(Boolean)
      .sort((a, b) => a!.distance - b!.distance)
      .slice(0, 50) as GarageWithDistance[];

    return {
      success: true,
      garages: result,
      count: result.length,
    };
  }

  async getGarageById(id: string, userLat?: number, userLng?: number) {
    const garage = await this.prisma.garage.findUnique({
      where: { id },
      include: {
        services: { include: { service: true } },
        reviews: { select: { overallExperience: true } },
      },
    });

    if (!garage || !garage.garageLat || !garage.garageLng) {
      return { success: false, data: null };
    }

    const distance =
      userLat && userLng
        ? this.calculateDistance(
            userLat,
            userLng,
            garage.garageLat,
            garage.garageLng,
          )
        : null;

    const total = (garage as any).reviews.reduce(
      (s: number, r: any) => s + r.overallExperience,
      0,
    );
    const avg = (garage as any).reviews.length
      ? total / (garage as any).reviews.length
      : 0;

    return {
      success: true,
      data: {
        id: garage.id,
        name: garage.name,
        garageLat: garage.garageLat,
        garageLng: garage.garageLng,
        distance: distance ? Number(distance.toFixed(2)) : 0,
        address: garage.address,
        profileImage: garage.profileImage,
        averageRating: Number(avg.toFixed(1)),
        totalReviews: (garage as any).reviews.length,
        services: (garage as any).services.map((gs: any) => gs.service),
        isOpenNow: this.isGarageOpen(
          garage.weekdaysHours,
          garage.weekendsHours,
        ),
      },
    };
  }
}
