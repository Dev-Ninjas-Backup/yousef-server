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
      sellerIsVerified,
      photos,
      ...productData
    } = createProductDto;

    if (!sellerEmail) {
      throw new Error('validation: Seller email is required.');
    }

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
          isVerified: sellerIsVerified || false,
        },
      });
    }

    // Create product and photos in transaction
    return this.prisma.$transaction(async (tx) => {
      const product = await tx.product.create({
        data: {
          sellerId: sellerInstance.id,
          status: 'Pending Approval',
          ...productData,
        },
      });

      if (photoUrls.length > 0) {
        await tx.photo.createMany({
          data: photoUrls.map((url) => ({
            url,
            productId: product.id,
          })),
        });
      }

      return tx.product.findUnique({
        where: { id: product.id },
        include: {
          seller: true,
          photos: true,
        },
      });
    });
  }

  async findAll() {
    return this.prisma.product.findMany({
      include: {
        seller: true,
        photos: true,
      },
    });
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        seller: true,
        photos: true,
      },
    });
    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }
    return product;
  }

  async update(
    id: string,

    updateProductDto: UpdateProductDto,

    files: Express.Multer.File[] = [],
  ) {
    const product = await this.prisma.product.findUnique({
      where: { id },

      include: { seller: true, photos: true },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    const {
      sellerName,
      sellerEmail,
      sellerPhoneNumber,
      sellerType,
      sellerIsVerified,
      photos,
      ...productData
    } = updateProductDto;

    // Upload new photos to S3

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

    // Update seller if provided

    if (
      sellerName ||
      sellerEmail ||
      sellerPhoneNumber ||
      sellerType ||
      sellerIsVerified !== undefined
    ) {
      const sellerUpdateData: any = {};

      if (sellerName) sellerUpdateData.name = sellerName;

      if (sellerEmail) sellerUpdateData.email = sellerEmail;

      if (sellerPhoneNumber) sellerUpdateData.phoneNumber = sellerPhoneNumber;

      if (sellerType) sellerUpdateData.sellerType = sellerType;

      if (sellerIsVerified !== undefined)
        sellerUpdateData.isVerified = sellerIsVerified;

      await this.prisma.seller.update({
        where: { id: product.sellerId },

        data: sellerUpdateData,
      });
    }

    // Update product and photos in transaction

    return this.prisma.$transaction(async (tx) => {
      const updatedProduct = await tx.product.update({
        where: { id },

        data: productData,
      });

      if (photoUrls.length > 0) {
        const photosToDelete = product.photos;

        await Promise.all(
          photosToDelete.map((photo) =>
            (this.s3FileService as any).deleteFile(photo.url),
          ),
        ).catch((e) => console.error('S3 Deletion during UPDATE Failed:', e));

        await tx.photo.deleteMany({ where: { productId: id } });

        await tx.photo.createMany({
          data: photoUrls.map((url) => ({
            url,

            productId: id,
          })),
        });
      }

      return tx.product.findUnique({
        where: { id },

        include: {
          seller: true,

          photos: true,
        },
      });
    });
  }

  async remove(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },

      include: { photos: true },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    return this.prisma.$transaction(async (tx) => {
      const photosToDelete = product.photos;

      await Promise.all(
        photosToDelete.map((photo) =>
          (this.s3FileService as any).deleteFile(photo.url),
        ),
      ).catch((e) => console.error('S3 Deletion during REMOVE Failed:', e));

      await tx.photo.deleteMany({ where: { productId: id } });

      return tx.product.delete({
        where: { id },

        include: {
          seller: true,

          photos: true,
        },
      });
    });
  }
}
