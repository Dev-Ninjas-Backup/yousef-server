import { Injectable } from '@nestjs/common';
import { HandleError } from 'src/common/error/handle-error.decorator';
import { successResponse } from 'src/common/utilsResponse/response.util';
import { PrismaService } from 'src/lib/prisma/prisma.service';

@Injectable()
export class UserManagementService {
  constructor(private readonly prisma: PrismaService) {}

  @HandleError('Failed to get all users', 'User')
  async getAllUsers() {
    const users = await this.prisma.user.findMany({
      where: {
        isDeleted: false,
      },
      select: {
        id: true,
        role: true,
        fullName: true,
        profilePhoto: true,
        bio: true,
        email: true,
        isActive: true,
        garageStatus: true,
        isGarageVerified: true,
        createdAt: true,
        updatedAt: true,
        isVerified: true,
        isDeleted: true,
      },
    });
    return successResponse(users, 'All users retrieved successfully');
  }

  // -------------get specific user access admin only--------
  @HandleError('Failed to get user', 'User')
  async getUser(id: string) {
    const user = await this.prisma.user.findUnique({
      where: {
        id,
        isDeleted: false,
      },
      select: {
        id: true,
        role: true,
        fullName: true,
        profilePhoto: true,
        bio: true,
        email: true,
        createdAt: true,
        updatedAt: true,
        isActive: true,
        deletedAt: true,
        garageStatus: true,
        isGarageVerified: true,
        isVerified: true,
        isDeleted: true,
      },
    });
    return successResponse(user, 'User retrieved successfully');
  }

  // -----------soft delete user access admin only
  @HandleError('Failed to delete user', 'User')
  async deleteUser(id: string) {
    const user = await this.prisma.user.update({
      where: {
        id,
        isDeleted: false,
      },
      data: {
        deletedAt: new Date(),
      },
    });
    return successResponse(user, 'User deleted successfully');
  }

  // soft delete user access admin only
  @HandleError('Failed to delete user', 'User')
  async remove(id: string) {
    const user = await this.prisma.user.update({
      where: {
        id,
        isDeleted: false,
      },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
      },
    });
    return successResponse(user, 'User deleted successfully');
  }
}
