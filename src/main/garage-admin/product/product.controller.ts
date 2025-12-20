import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  InternalServerErrorException,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';

import { AnyFilesInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { GetUser, ValidateAuth } from 'src/common/jwt/jwt.decorator';
import { FileType, MulterService } from 'src/lib/multer/multer.service';
import { PaymentService } from '../../shared/payment/service/payment.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductService } from './product.service';
@ApiTags('Products')
@Controller('products')
export class ProductController {
  constructor(
    private readonly productService: ProductService,
    private readonly paymentService: PaymentService,
  ) {}

  @ValidateAuth()
  @ApiBearerAuth()
  @Post()
  @ApiOperation({ summary: 'Create a new product with seller and photos' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    AnyFilesInterceptor(
      new MulterService().createMulterOptions(
        './Uploads',
        'products',
        FileType.IMAGE,
      ),
    ),
  )
  @ApiBody({ type: CreateProductDto })
  @ApiResponse({ status: 201, description: 'Product created successfully.' })
  @ApiResponse({ status: 400, description: 'Bad request.' })
  async create(
    @GetUser('userId') userId: string,
    @Body() createProductDto: CreateProductDto,
    @UploadedFiles() files: Express.Multer.File[] = [],
  ) {
    try {
      console.log('Create Product', createProductDto);

      // Extract verificationImage from files if present
      const verificationImageFile = files.find(
        (f) => f.fieldname === 'verificationImage',
      );
      const photoFiles = files.filter((f) => f.fieldname === 'photos');

      return await this.productService.create(
        userId,
        createProductDto,
        photoFiles,
        verificationImageFile,
      );
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException ||
        error.message.includes('validation') ||
        error.message.includes('Payment required') ||
        error.message.includes('subscription required') ||
        error.message.includes('User not found')
      ) {
        throw new BadRequestException(error.message || error);
      }
      throw new InternalServerErrorException('Failed to create product');
    }
  }

  // --- Public Get Routes ---

  @Get()
  @ApiOperation({
    summary: 'Get all products with search, filter and pagination',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    example: 1,
    description: 'Page number (default: 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    example: 10,
    description: 'Items per page (default: 10)',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    example: 'Brake Pads Front Set',
    description: 'Search in name/description',
  })
  @ApiQuery({
    name: 'category',
    required: false,
    type: String,
    example: 'Engine Parts',
    description: 'Filter by category name',
  })
  @ApiQuery({
    name: 'condition',
    required: false,
    type: String,
    example: 'New',
    description: 'Filter by condition ',
  })
  @ApiResponse({ status: 200, description: 'List of products with pagination' })
  async findAll(
    @Query('page') page = '1',
    @Query('limit') limit = '20',
    @Query('search') search?: string,
    @Query('category') category?: string,
    @Query('condition') condition?: string,
  ) {
    return this.productService.findAll({
      page,
      limit,
      search,
      category,
      condition,
    });
  }

  // My products

  @ApiBearerAuth()
  @ValidateAuth()
  @Get('my-products')
  @ApiOperation({ summary: 'Get my products' })
  @ApiResponse({ status: 200, description: 'List of my products.' })
  async findMyProducts(@GetUser('userId') userId: string) {
    return this.productService.findMyProducts(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a product by ID' })
  @ApiResponse({ status: 200, description: 'Product details.' })
  @ApiResponse({ status: 404, description: 'Product not found.' })
  async findOne(@Param('id') id: string) {
    return this.productService.findOne(id);
  }

  // -------------------------------

  @ValidateAuth()
  @ApiBearerAuth()
  @Patch(':id')
  @ApiOperation({ summary: 'Update a product by ID' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    AnyFilesInterceptor(
      new MulterService().createMulterOptions(
        './Uploads',
        'products',
        FileType.IMAGE,
      ),
    ),
  )
  @ApiBody({ type: UpdateProductDto })
  @ApiResponse({ status: 200, description: 'Product updated successfully.' })
  @ApiResponse({ status: 404, description: 'Product not found.' })
  async update(
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
    @UploadedFiles() files: Express.Multer.File[] = [],
  ) {
    try {
      const verificationImageFile = files.find(
        (f) => f.fieldname === 'verificationImage',
      );
      const photoFiles = files.filter((f) => f.fieldname === 'photos');

      return await this.productService.update(
        id,
        updateProductDto,
        photoFiles,
        verificationImageFile,
      );
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error.message.includes('not found')
      ) {
        throw new NotFoundException(error.message);
      }
      throw new InternalServerErrorException('Failed to update product');
    }
  }

  @ValidateAuth()
  @ApiBearerAuth()
  @Delete(':id')
  @ApiOperation({ summary: 'Delete a product by ID' })
  @ApiResponse({ status: 200, description: 'Product deleted successfully.' })
  @ApiResponse({ status: 404, description: 'Product not found.' })
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id') id: string) {
    try {
      return await this.productService.remove(id);
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error.message.includes('not found')
      ) {
        throw new NotFoundException(error.message);
      }
      throw new InternalServerErrorException('Failed to delete product');
    }
  }

  @ValidateAuth()
  @ApiBearerAuth()
  @Get('user/limit')
  @ApiOperation({
    summary: 'Check user free product limit status (role-based)',
  })
  @ApiResponse({
    status: 200,
    description:
      'Returns user product limit information including used and remaining free listings.',
  })
  async getUserLimit(@GetUser('userId') userId: string) {
    return this.productService.getUserProductLimit(userId);
  }

  // Create checkout session for monthly plan
  @ValidateAuth()
  @ApiBearerAuth()
  @Post('create-monthly-payment')
  @ApiOperation({
    summary: 'Create checkout session for Product Monthly Plan ',
  })
  async createProductMonthlyPayment(@GetUser('userId') userId: string) {
    return this.paymentService.createProductMonthlySession(userId);
  }

  // Create checkout session for pay-per product
  @ValidateAuth()
  @ApiBearerAuth()
  @Post('create-payper-payment')
  @ApiOperation({
    summary: 'Create checkout session for pay-per product ',
  })
  @ApiResponse({
    status: 200,
    description: 'Pay-per product checkout session created',
  })
  async createPayPerPayment(@GetUser('userId') userId: string) {
    return this.paymentService.createPayPerProductSession(userId);
  }

  // Create checkout session for product promotion
  @ValidateAuth()
  @ApiBearerAuth()
  @Post('create-promotion-payment')
  @ApiOperation({
    summary: 'Create checkout session for product promotion ',
  })
  @ApiResponse({
    status: 200,
    description: 'Product promotion checkout session created',
  })
  async createPromotionPayment(@GetUser('userId') userId: string) {
    return this.paymentService.createPromotionPaymentSession(userId);
  }
}
