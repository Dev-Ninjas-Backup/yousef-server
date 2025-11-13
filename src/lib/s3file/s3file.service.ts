// file.service.ts
import { Injectable, BadRequestException } from '@nestjs/common';
import { S3 } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as mime from 'mime-types';

@Injectable()
export class S3FileService {
  private readonly s3: S3;

  constructor() {
    if (!process.env.ACCESS_KEY || !process.env.ACCESS_SECRET) {
      throw new Error('Missing AWS credentials');
    }
    this.s3 = new S3({
      region: 'us-east-1',
      credentials: {
        accessKeyId: process.env.ACCESS_KEY,
        secretAccessKey: process.env.ACCESS_SECRET,
      },
    });
  }
  async processUploadedFile(
    file: Express.Multer.File,
  ): Promise<{ url: string; key: string }> {
    //------- Validate file object------------
    if (!file) {
      throw new BadRequestException('No file provided');
    }
    if (!file.path) {
      throw new BadRequestException(
        'File path is missing; ensure Multer is configured with diskStorage',
      );
    }

    //-----  Validate file type and size ------
    const allowedTypes = [
      // Images
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/svg+xml',
      'image/bmp',
      'image/tiff',
      'image/heic',
      'image/heif',
      'image/avif',

      // Videos
      'video/mp4',
      'video/webm',
      'video/ogg',
      'video/mov',

      // Audio
      'audio/mpeg',
      'audio/mp3',
      'audio/wav',
      'audio/ogg',
      'audio/aac',
      'audio/flac',
    ];
    const mimeType = file.mimetype;
    if (!allowedTypes.includes(mimeType)) {
      throw new BadRequestException(`Invalid file type: ${mimeType}`);
    }
    if (file.size > 9000 * 1024 * 1024) {
      throw new BadRequestException('File size exceeds 2GB');
    }

    const ext = path.extname(file.originalname);
    const baseName = path.basename(file.originalname, ext);
    const safeFileName = `${Date.now()}-${baseName.replace(/[^a-zA-Z0-9.-]/g, '_')}${ext}`;
    const contentType = mime.lookup(ext) || 'application/octet-stream';

    const upload = new Upload({
      client: this.s3,
      params: {
        Bucket: 'newportalbucket1122',
        Key: `content/${safeFileName}`,
        Body: await fs.readFile(file.path),
        ContentType: contentType,
      },
    });

    try {
      const result = await upload.done();
      try {
        await fs.unlink(file.path);
        console.log(`Deleted local file: ${file.path}`);
      } catch (err) {
        if (err.code !== 'ENOENT') {
          console.warn(`Failed to delete local file ${file.path}:`, err);
        }
      }
      return {
        url: result.Location as string,
        key: safeFileName,
      };
    } catch (err) {
      try {
        await fs.unlink(file.path);
      } catch (unlinkErr) {
        if (unlinkErr.code !== 'ENOENT') {
          console.warn(`Failed to delete local file ${file.path}:`, unlinkErr);
        }
      }
      console.error('Failed to upload file to S3:', err);
      throw new BadRequestException('Failed to upload file to S3');
    }
  }
}
