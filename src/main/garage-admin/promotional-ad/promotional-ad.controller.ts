import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { GetUser, ValidateUser } from '../../../common/jwt/jwt.decorator';
import { FileType, MulterService } from '../../../lib/multer/multer.service';
import { CreatePromotionalAdDto } from './dto/create-promotional-ad.dto';
import { UpdatePromotionalAdDto } from './dto/update-promotional-ad.dto';
import { PromotionalAdService } from './promotional-ad.service';

@ApiTags('Promotional Ads')
@ApiBearerAuth()
@ValidateUser()
@Controller('promotional-ad')
export class PromotionalAdController {
  constructor(private readonly promotionalAdService: PromotionalAdService) {}

  @Post()
  @ApiOperation({
    summary: 'Create promotional ad',
    description:
      'Create a new promotional advertisement. You can upload images and/or provide image URLs.',
  })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FilesInterceptor(
      'images',
      5,
      new MulterService().createMulterOptions('./temp', 'ads', FileType.IMAGE),
    ),
  )
  create(
    @Body() createDto: CreatePromotionalAdDto,
    @GetUser('userId') userId: string,
    @UploadedFiles() files?: Express.Multer.File[],
  ) {
    createDto.userId = userId;
    return this.promotionalAdService.create(createDto, files);
  }

  @Get()
  @ApiOperation({
    summary: 'Get promotional ads',
    description:
      "Get all promotional ads. By default returns user's own ads, admin can see all.",
  })
  @ApiQuery({
    name: 'userId',
    required: false,
    description: 'Filter by user ID (admin only)',
  })
  findAll(
    @Query('userId') queryUserId?: string,
    @GetUser('userId') userId?: string,
  ) {
    return this.promotionalAdService.findAll(queryUserId || userId);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get promotional ad by ID',
    description: 'Get detailed information about a specific promotional ad',
  })
  findOne(@Param('id') id: string) {
    return this.promotionalAdService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update promotional ad',
    description:
      'Update an existing promotional ad. Can add more images or update details.',
  })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FilesInterceptor(
      'images',
      5,
      new MulterService().createMulterOptions('./temp', 'ads', FileType.IMAGE),
    ),
  )
  update(
    @Param('id') id: string,
    @Body() updateDto: UpdatePromotionalAdDto,
    @UploadedFiles() files?: Express.Multer.File[],
  ) {
    return this.promotionalAdService.update(id, updateDto, files);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete promotional ad',
    description: 'Permanently delete a promotional advertisement',
  })
  remove(@Param('id') id: string) {
    return this.promotionalAdService.remove(id);
  }
}
