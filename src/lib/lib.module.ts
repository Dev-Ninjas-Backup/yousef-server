import { Module } from '@nestjs/common';
import { FileModule } from './file/file.module';
import { MailModule } from './mail/mail.module';
import { MulterModule } from './multer/multer.module';
import { PrismaModule } from './prisma/prisma.module';
import { S3FileModule } from './s3file/s3file.module';
import { SeedModule } from './seed/seed.module';
import { TranslationModule } from './translation/translation.module';
import { UtilsModule } from './utils/utils.module';

@Module({
  imports: [
    SeedModule,
    PrismaModule,
    MailModule,
    UtilsModule,
    FileModule,
    MulterModule,
    S3FileModule,
    TranslationModule,
  ],
  exports: [TranslationModule],
  providers: [],
})
export class LibModule {}
