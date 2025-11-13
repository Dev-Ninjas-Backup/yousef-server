import { Module } from '@nestjs/common';
import { FileModule } from './file/file.module';
import { MailModule } from './mail/mail.module';
import { PrismaModule } from './prisma/prisma.module';
import { SeedModule } from './seed/seed.module';
import { UtilsModule } from './utils/utils.module';
import { MulterModule } from './multer/multer.module';
import { S3FileModule } from './s3file/s3file.module';

@Module({
  imports: [
    SeedModule,
    PrismaModule,
    MailModule,
    UtilsModule,
    FileModule,
    MulterModule,
    S3FileModule,
  ],
  exports: [],
  providers: [],
})
export class LibModule {}
