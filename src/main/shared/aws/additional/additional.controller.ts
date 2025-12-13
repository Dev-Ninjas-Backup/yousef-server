import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UploadedFile,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';

import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { ApiConsumes, ApiTags } from '@nestjs/swagger';
import { FileType, MulterService } from 'src/lib/multer/multer.service';
import uploadFileToS3 from 'src/lib/utils/uploadImageAWS';
import {
  Additionaldto,
  AdditionalMultipleDto,
} from '../dto/uploadadditional.dto';
import { AdditionalS3Service } from './additional.service';
@ApiTags('aws-file-upload-additional-all')
@Controller('aws-file-upload-additional-all')
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
      file: s3Result.url,
      key: s3Result.key,
    };
  }
// ------------------ upload multiple files----------------
  @Post('upload-s3-additional-multiple')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FilesInterceptor(
      'files',
      10,
      new MulterService().createMulterOptions(
        './uploads',
        'content',
        FileType.ANY,
      ),
    ),
  )
  async createMultiple(
    @Body() createTestawDto: AdditionalMultipleDto,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    if (!files || files.length === 0) {
      return { message: 'No files uploaded' };
    }

    const s3Results = await Promise.all(
      files.map((file) => uploadFileToS3(file?.path)),
    );

    return {
      message: 'Files uploaded successfully to S3',
      files: s3Results.map((result) => result.url),
      keys: s3Results.map((result) => result.key),
    };
  }

// --------deleteFileFromS3-----------
  @Delete('delete-s3-additional/:key')
  async deleteFile(@Param('key') key: string) {
    try {
      await this.AdditionalS3Service.deleteFileFromS3(key);
      return { message: 'File deleted successfully from S3' };
    } catch (error) {
      return { message: 'Failed to delete file from S3', error };
    }
  }
}
