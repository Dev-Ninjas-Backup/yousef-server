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
import { TestawsService } from './testaws.service';
import { CreateTestawDto } from './dto/create-testaw.dto';
import { UpdateTestawDto } from './dto/update-testaw.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { FileType, MulterService } from 'src/lib/multer/multer.service';
import { ApiConsumes } from '@nestjs/swagger';
import uploadFileToS3 from 'src/lib/utils/uploadImageAWS';

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
    const s3Result = await uploadFileToS3(file?.path)
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

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateTestawDto: UpdateTestawDto) {
    return this.testawsService.update(+id, updateTestawDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.testawsService.remove(+id);
  }
}
