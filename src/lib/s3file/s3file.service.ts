import { S3 } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs/promises';
import * as mime from 'mime-types';
import * as path from 'path';
import { ENVEnum } from 'src/common/enum/env.enum';

@Injectable()
export class S3FileService {
  private readonly s3: S3;

  constructor(private readonly config: ConfigService) {
    const accessKeyId = this.config.get<string>(ENVEnum.ACCESS_KEY);
    const secretAccessKey = this.config.get<string>(ENVEnum.ACCESS_SECRET);
    const region = this.config.get<string>(ENVEnum.BUCKET_REGION);

    if (!accessKeyId || !secretAccessKey || !region) {
      throw new Error('AWS S3 environment variables are missing');
    }

    this.s3 = new S3({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
  }

  async processUploadedFile(
    file: Express.Multer.File,
  ): Promise<{ url: string; key: string }> {
    if (!file || !file.path) {
      throw new BadRequestException('Invalid file upload');
    }

    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'video/mp4',
      'audio/mpeg',
    ];

    if (!allowedTypes.includes(file.mimetype)) {
      throw new BadRequestException(`Invalid file type: ${file.mimetype}`);
    }

    const ext = path.extname(file.originalname);
    const safeFileName =
      Date.now() + '-' + file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');

    const upload = new Upload({
      client: this.s3,
      params: {
        Bucket: this.config.get<string>(ENVEnum.BUCKET_NAME)!,
        Key: `content/${safeFileName}`,
        Body: await fs.readFile(file.path),
        ContentType: mime.lookup(ext) || 'application/octet-stream',
      },
    });

    try {
      const result = await upload.done();
      await fs.unlink(file.path);

      return {
        url: result.Location as string,
        key: safeFileName,
      };
    } catch (err) {
      await fs.unlink(file.path).catch(() => {});
      throw new BadRequestException('Failed to upload file to S3');
    }
  }
}
