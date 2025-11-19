import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import {
  ValidateAdmin,
  ValidateAuth,
  ValidateSuperAdmin,
} from 'src/common/jwt/jwt.decorator';
import { CreatePartsCategoryDto } from './dto/create-parts-category.dto';
import { QueryPartsCategoryDto } from './dto/query-parts-category.dto';
import { UpdatePartsCategoryDto } from './dto/update-parts-category.dto';
import { PartsCategoryService } from './parts-category.service';

@ApiTags('Parts Category')
@Controller('parts-category')
export class PartsCategoryController {
  constructor(private readonly partsService: PartsCategoryService) {}

  @ApiBearerAuth()
  @ValidateAuth()
  @ValidateAdmin()
  @Post()
  @ApiOperation({ summary: 'Create a parts category' })
  @ApiResponse({
    status: 201,
    description: 'Parts category created successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed' })
  @ApiResponse({ status: 409, description: 'Parts category already exists' })
  async create(@Body() createPartsCategoryDto: CreatePartsCategoryDto) {
    return this.partsService.create(createPartsCategoryDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all parts categories with search and pagination',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Search by category name',
  })
  @ApiQuery({ name: 'page', required: false, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page' })
  @ApiResponse({
    status: 200,
    description: 'Parts categories retrieved successfully',
  })
  async findAll(@Query() query: QueryPartsCategoryDto) {
    return this.partsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a parts category by ID' })
  @ApiParam({ name: 'id', description: 'Parts category ID', type: 'string' })
  @ApiResponse({
    status: 200,
    description: 'Parts category retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Parts category not found' })
  async findOne(@Param('id') id: string) {
    return this.partsService.findOne(id);
  }

  @ApiBearerAuth()
  @ValidateAuth()
  @ValidateAdmin()
  @Patch(':id')
  @ApiOperation({ summary: 'Update a parts category' })
  @ApiParam({ name: 'id', description: 'Parts category ID', type: 'string' })
  @ApiResponse({
    status: 200,
    description: 'Parts category updated successfully',
  })
  @ApiResponse({ status: 404, description: 'Parts category not found' })
  @ApiResponse({
    status: 409,
    description: 'Parts category name already exists',
  })
  async update(
    @Param('id') id: string,
    @Body() updatePartsCategoryDto: UpdatePartsCategoryDto,
  ) {
    return this.partsService.update(id, updatePartsCategoryDto);
  }

  @ApiBearerAuth()
  @ValidateAuth()
  @ValidateAdmin()
  @Delete(':id')
  @ApiOperation({ summary: 'Delete a parts category' })
  @ApiParam({ name: 'id', description: 'Parts category ID', type: 'string' })
  @ApiResponse({
    status: 200,
    description: 'Parts category deleted successfully',
  })
  @ApiResponse({ status: 404, description: 'Parts category not found' })
  async remove(@Param('id') id: string) {
    return this.partsService.remove(id);
  }

  @ApiBearerAuth()
  @ValidateAuth()
  @ValidateSuperAdmin()
  @Get('statistics/overview')
  @ApiOperation({
    summary: 'Get parts category statistics with product count and percentage',
  })
  @ApiResponse({
    status: 200,
    description: 'Parts category statistics retrieved successfully',
  })
  async getStatistics() {
    return this.partsService.getStatistics();
  }
}
