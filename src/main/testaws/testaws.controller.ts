import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiConsumes } from '@nestjs/swagger';
import { FileType, MulterService } from 'src/lib/multer/multer.service';
import uploadFileToS3 from 'src/lib/utils/uploadImageAWS';
import { CreateTestawDto } from './dto/create-testaw.dto';
import { TestawsService } from './testaws.service';

@Controller('testaws')
export class TestawsController {
  constructor(private readonly testawsService: TestawsService) {}

  @Post()
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
    @Body() createTestawDto: CreateTestawDto,
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
    return this.testawsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.testawsService.findOne(+id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.testawsService.remove(+id);
  }
}
