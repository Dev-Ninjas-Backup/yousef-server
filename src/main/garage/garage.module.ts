import { Module } from '@nestjs/common';
import { MulterService } from 'src/lib/multer/multer.service';
import { S3FileService } from 'src/lib/s3file/s3file.service';
import { GarageController } from './controller/garage.controller';
import { GarageService } from './service/garage.service';

@Module({
  controllers: [GarageController],
  providers: [GarageService, MulterService, S3FileService]
})
export class GarageModule {}
