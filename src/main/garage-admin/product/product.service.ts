import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/lib/prisma/prisma.service';
import { S3FileService } from 'src/lib/s3file/s3file.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductService {
  constructor(
    private prisma: PrismaService,
    private s3FileService: S3FileService,
  ) {}

  async create(
    userId: string,
    createProductDto: CreateProductDto,
    files: Express.Multer.File[] = [],
  ) {
    const {
      sellerEmail,
      sellerName,
      sellerPhoneNumber,
      sellerType,
      photos,
      ...productData
    } = createProductDto;

    // Check if product is promoted and require payment
    if (productData.isPromoted) {
      throw new Error(
        'To promote your product, you need to pay 20 AED first. Please complete the payment to create a promoted listing.',
      );
    }

    if (!sellerEmail) {
      throw new Error('validation: Seller email is required.');
    }

    // Find or create seller based on email
    let sellerInstance = await this.prisma.seller.findUnique({
      where: { email: sellerEmail },
    });

    if (!sellerInstance) {
      // Create seller if not found
      sellerInstance = await this.prisma.seller.create({
        data: {
          name: sellerName,
          email: sellerEmail,
          phoneNumber: sellerPhoneNumber,
          sellerType,
          freeProductsUsed: 0,
        },
      });
    }

    // Check free product limit per USER (role-based)
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      console.log(`❌ ERROR: User with ID ${userId} not found in database`);
      throw new Error('User not found. Please login again or contact support.');
    }

    const userFreeProductsUsed = user.freeProductsListing || 0;

    console.log(`=== USER LIMIT CHECK ===`);
    console.log(`User ID: ${userId}`);
    console.log(`User Email: ${user.email}`);
    console.log(`Current freeProductsListing: ${userFreeProductsUsed}`);
    console.log(`Can create product: ${userFreeProductsUsed < 2}`);

    if (userFreeProductsUsed >= 2) {
      console.log(`❌ BLOCKED: User has reached limit`);
      throw new Error(
        'You have already used your 2 free product listings. To continue selling, please upgrade to a paid plan.',
      );
    }

    console.log(
      `✅ ALLOWED: Incrementing count from ${userFreeProductsUsed} to ${userFreeProductsUsed + 1}`,
    );

    // Increment user's free products used count
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        freeProductsListing: userFreeProductsUsed + 1,
      },
    });

    console.log(`=== USER LIMIT CHECK COMPLETE ===`);

    // Upload photos to S3
    const photoUrls: string[] = [];
    if (files && files.length > 0) {
      for (const file of files) {
        try {
          const { url } = await this.s3FileService.processUploadedFile(file);
          photoUrls.push(url);
        } catch (error) {
          throw new Error(`Failed to upload photo: ${error.message}`);
        }
      }
    }

    // Create product with photos array and default promoCost
    const product = await this.prisma.product.create({
      data: {
        sellerId: sellerInstance.id,
        status: 'PENDING',
        photos: photoUrls,
        views: 0,
        promoCost: productData.isPromoted ? 20 : null,
        ...productData,
      },
      include: {
        seller: true,
      },
    });

    return product;
  }

  async findAll() {
    return this.prisma.product.findMany({
      include: {
        seller: true,
      },
    });
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        seller: true,
      },
    });
    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    // Increment view count
    await this.prisma.product.update({
      where: { id },
      data: {
        views: {
          increment: 1,
        },
      },
    });

    return { ...product, views: product.views + 1 };
  }

  async update(
    id: string,
    updateProductDto: UpdateProductDto,
    files: Express.Multer.File[] = [],
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

      photos,
      ...productData
    } = updateProductDto;

    // Upload new photos to S3
    const photoUrls: string[] = [];
    if (files && files.length > 0) {
      // Delete old photos from S3
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
          throw new Error(`Failed to upload photo: ${error.message}`);
        }
      }
    }

    // Update seller if provided
    if (sellerName || sellerEmail || sellerPhoneNumber || sellerType || false) {
      const sellerUpdateData: any = {};
      if (sellerName) sellerUpdateData.name = sellerName;
      if (sellerEmail) sellerUpdateData.email = sellerEmail;
      if (sellerPhoneNumber) sellerUpdateData.phoneNumber = sellerPhoneNumber;
      if (sellerType) sellerUpdateData.sellerType = sellerType;

      await this.prisma.seller.update({
        where: { id: product.sellerId },
        data: sellerUpdateData,
      });
    }

    // Update product with new photos array
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
      },
    });
  }

  async remove(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
    });
    console.log('Product', product);

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    return this.prisma.product.delete({
      where: { id },
      include: {
        seller: true,
      },
    });
  }

  async getUserProductLimit(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return {
        userId,
        userEmail: 'User not found',
        freeProductsUsed: 0,
        freeProductsRemaining: 2,
        canAddFreeProduct: true,
      };
    }

    const freeProductsUsed = user.freeProductsListing || 0;

    const freeProductsRemaining = Math.max(0, 2 - freeProductsUsed);
    const canAddFreeProduct = freeProductsUsed < 2;

    return {
      userId,
      userEmail: user.email,
      freeProductsUsed,
      freeProductsRemaining,
      canAddFreeProduct,
    };
  }
}
