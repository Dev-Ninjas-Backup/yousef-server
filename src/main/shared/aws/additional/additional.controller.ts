import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';

import { FileInterceptor } from '@nestjs/platform-express';
import { FileType, MulterService } from 'src/lib/multer/multer.service';
import { ApiConsumes } from '@nestjs/swagger';
import uploadFileToS3 from 'src/lib/utils/uploadImageAWS';
import { AdditionalS3Service } from './additional.service';
import { Additionaldto } from '../uploadadditional.dto';

@Controller('aws-additional')
export class AdditionalS3Controller {
  constructor(private readonly AdditionalS3Service: AdditionalS3Service) {}

  @Post('upload-s3-additional')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor(
      'file',
      new MulterService().createMulterOptions(
        './uploads',
        'content',
        FileType.ANY,
      ),
    ),
  )
  async create(
    @Body() createTestawDto: Additionaldto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      return { message: 'No file uploaded' };
    }

    //  Upload to AWS S3
    const s3Result = await uploadFileToS3(file?.path);
    console.log(' Uploaded to S3:', s3Result.url);

    return {
      message: ' File uploaded successfully to S3',
      s3Url: s3Result.url,
      key: s3Result.key,
    };
  }

  @Get()
  findAll() {
    return this.AdditionalS3Service.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.AdditionalS3Service.findOne(+id);
  }
}
