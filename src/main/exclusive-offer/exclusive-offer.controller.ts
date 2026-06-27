import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ValidateAdmin } from 'src/common/jwt/jwt.decorator';
import { FileInterceptor } from '@nestjs/platform-express';
import { FileType, MulterService } from 'src/lib/multer/multer.service';
import { S3FileService } from 'src/lib/s3file/s3file.service';
import { ExclusiveOfferService } from './exclusive-offer.service';
import { CreateExclusiveOfferDto } from './dto/create-exclusive-offer.dto';
import { UpdateExclusiveOfferDto } from './dto/update-exclusive-offer.dto';
import { AppError } from 'src/common/error/handle-error.app';

@ApiTags('exclusive-offer')
@Controller('exclusive-offer')
export class ExclusiveOfferController {
  constructor(
    private readonly exclusiveOfferService: ExclusiveOfferService,
    private readonly s3FileService: S3FileService,
  ) {}

  @ApiBearerAuth()
  @ValidateAdmin()
  @ApiOperation({
    summary: 'Create a new published exclusive offer (Admin only)',
  })
  @Post()
  @UseInterceptors(
    FileInterceptor(
      'bannerImage',
      new MulterService().createMulterOptions(
        './Uploads',
        'exclusive-offer',
        FileType.IMAGE,
        100 * 1024 * 1024,
      ),
    ),
  )
  async create(
    @Body() dto: CreateExclusiveOfferDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (!file) {
      throw new AppError(400, 'Banner image file is required');
    }
    const processedFile = await this.s3FileService.processUploadedFile(file);
    return this.exclusiveOfferService.create(dto, processedFile.url);
  }

  @ApiOperation({ summary: 'Get all published exclusive offers' })
  @Get()
  findAll() {
    return this.exclusiveOfferService.findAll();
  }

  @ApiOperation({ summary: 'Get details of an exclusive offer' })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.exclusiveOfferService.findOne(id);
  }

  @ApiBearerAuth()
  @ValidateAdmin()
  @ApiOperation({ summary: 'Update an exclusive offer (Admin only)' })
  @Patch(':id')
  @UseInterceptors(
    FileInterceptor(
      'bannerImage',
      new MulterService().createMulterOptions(
        './Uploads',
        'exclusive-offer',
        FileType.IMAGE,
        100 * 1024 * 1024,
      ),
    ),
  )
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateExclusiveOfferDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    let bannerImageUrl: string | undefined = undefined;
    if (file) {
      const processedFile = await this.s3FileService.processUploadedFile(file);
      bannerImageUrl = processedFile.url;
    }
    return this.exclusiveOfferService.update(id, dto, bannerImageUrl);
  }

  @ApiBearerAuth()
  @ValidateAdmin()
  @ApiOperation({ summary: 'Delete an exclusive offer (Admin only)' })
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.exclusiveOfferService.remove(id);
  }
}
