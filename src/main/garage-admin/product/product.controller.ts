import {
    BadRequestException,
    Body,
    Controller,
    Delete,
    Get, // <-- ADDED: Get import
    HttpCode,
    HttpStatus,
    InternalServerErrorException,
    NotFoundException,
    Param,
    Patch,
    Post,
    UploadedFiles,
    UseInterceptors
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import {
    ApiBearerAuth,
    ApiBody,
    ApiConsumes,
    ApiOperation,
    ApiResponse,
    ApiTags,
} from '@nestjs/swagger';
import { GetUser, ValidateAuth } from 'src/common/jwt/jwt.decorator';
import { FileType, MulterService } from 'src/lib/multer/multer.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductService } from './product.service';

@ApiTags('products')
@Controller('products')
export class ProductController {
    constructor(private readonly productService: ProductService) { }

    @ValidateAuth()
    @ApiBearerAuth()
    @Post()
    @ApiOperation({ summary: 'Create a new product with seller and photos' })
    @ApiConsumes('multipart/form-data')
    @UseInterceptors(
        FilesInterceptor(
            'photos',
            5,
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
            console.log("Create Product", createProductDto);
            // PASSING userId to service for seller identity/creation validation
            return await this.productService.create(userId, createProductDto, files);
        } catch (error) {
            // Improved error handling
            if (error instanceof NotFoundException || error.message.includes('validation')) {
                throw new BadRequestException(error.message);
            }
            throw new InternalServerErrorException('Failed to create product');
        }
    }

    // --- Public Get Routes Added ---

    @Get()
    @ApiOperation({ summary: 'Get all products' })
    @ApiResponse({ status: 200, description: 'List of all products.' })
    async findAll() {
        return this.productService.findAll();
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
        FilesInterceptor(
            'photos',
            5, // FIX: Changed max files from 10 to 5 to match UI limit
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
            return await this.productService.update(id, updateProductDto, files);
        } catch (error) {
            if (error instanceof NotFoundException || error.message.includes('not found')) {
                throw new NotFoundException(error.message);
            }
            throw new InternalServerErrorException('Failed to update product');
        }
    }

    @ValidateAuth()
    @ApiBearerAuth()
    @Delete(':id')
    @ApiOperation({ summary: 'Delete a product by ID' })
    @ApiResponse({ status: 204, description: 'Product deleted successfully.' })
    @ApiResponse({ status: 404, description: 'Product not found.' })
    @HttpCode(HttpStatus.NO_CONTENT)
    async remove(@Param('id') id: string) {
        try {
            await this.productService.remove(id);
        } catch (error) {
            if (error instanceof NotFoundException || error.message.includes('not found')) {
                throw new NotFoundException(error.message);
            }
            throw new InternalServerErrorException('Failed to delete product');
        }
    }
}