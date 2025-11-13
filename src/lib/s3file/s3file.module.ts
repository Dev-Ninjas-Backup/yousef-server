import { Global, Module } from '@nestjs/common';
import { S3FileService } from './s3file.service';

@Global()
@Module({
  providers: [S3FileService],
  exports: [S3FileService],
})
export class S3FileModule {}
