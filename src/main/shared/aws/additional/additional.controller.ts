import { BadRequestException, Controller, Post, UploadedFile, UploadedFiles, UseInterceptors } from "@nestjs/common";
import { FileInterceptor, FilesInterceptor } from "@nestjs/platform-express";
import { ApiConsumes, ApiTags } from "@nestjs/swagger";
import { join } from "path";
import { FileType, MulterService } from "src/lib/multer/multer.service";
import { S3FileService } from "src/lib/s3file/s3file.service";
import { AdditionalS3Service } from "./additional.service";

@ApiTags('aws-file-upload-additional-all')
@Controller('aws-file-upload-additional-all')
export class AdditionalS3Controller {
  constructor(
    private readonly s3FileService: S3FileService,
    private readonly additionalS3Service: AdditionalS3Service,
  ) { }

  @Post('upload-s3-additional')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor(
      'file',
      new MulterService().createMulterOptions(
        join('/tmp', 'uploads'),
        'content',
        FileType.ANY,
      ),
    ),
  )
  async create(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const result = await this.s3FileService.processUploadedFile(file);

    return {
      message: 'File uploaded successfully to S3',
      file: result.url,
      key: result.key,
    };
  }

  @Post('upload-s3-additional-multiple')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FilesInterceptor(
      'files',
      10,
      new MulterService().createMulterOptions(
        join('/tmp', 'uploads'),
        'content',
        FileType.ANY,
      ),
    ),
  )
  async createMultiple(@UploadedFiles() files: Express.Multer.File[]) {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files uploaded');
    }

    const results = await Promise.all(
      files.map((file) => this.s3FileService.processUploadedFile(file)),
    );

    return {
      message: 'Files uploaded successfully to S3',
      files: results.map((r) => r.url),
      keys: results.map((r) => r.key),
    };
  }


}
