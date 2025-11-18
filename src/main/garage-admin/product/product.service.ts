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
  ) { }

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

    // Create product with photos array
    const product = await this.prisma.product.create({
      data: {
        sellerId: sellerInstance.id,
        status: 'PENDING',
        photos: photoUrls,
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
    return product;
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
      sellerIsVerified,
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

    // Update product with new photos array
    const updateData: any = {
      ...productData
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
    console.log("Product", product);

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
}
