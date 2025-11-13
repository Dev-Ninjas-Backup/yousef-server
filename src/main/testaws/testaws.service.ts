import { Injectable } from '@nestjs/common';
import { S3 } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import * as fs from 'fs';
import * as path from 'path';
import * as mime from 'mime-types';
import { promisify } from 'util';
import { CreateTestawDto } from './dto/create-testaw.dto';
import { UpdateTestawDto } from './dto/update-testaw.dto';

const unlinkAsync = promisify(fs.unlink);

@Injectable()
export class TestawsService {
  private s3: S3;

  constructor() {
    this.s3 = new S3({
      region: process.env.BUCKET_REGION!,
      credentials: {
        accessKeyId: process.env.ACCESS_KEY!,
        secretAccessKey: process.env.ACCESS_SECRET!,
      },
    });
  }

  async uploadFileToS3(
    localFilePath: string,
    prefix: string,
  ) {
    const fileContent = fs.readFileSync(localFilePath);
    const fileExt = path.extname(localFilePath);
    const fileName = `${prefix}-${path.basename(localFilePath)}`;
    const mimeType = mime.lookup(fileExt) || 'application/octet-stream';

    try {
      const upload = new Upload({
        client: this.s3,
        params: {
          Bucket: process.env.BUCKET_REGION!,
          Key: fileName,
          Body: fileContent,
          ContentType: mimeType,
        },
      });

      const result = await upload.done();

      // Delete local file after successful upload
      await unlinkAsync(localFilePath);
      console.log(`🧹 Deleted local file: ${localFilePath}`);

      return {
        url: result.Location,
        key: fileName,
      };
    } catch (error) {
      console.error('❌ Upload failed:', error);
      throw error;
    }
  }

  create(createTestawDto: CreateTestawDto) {
    return 'This action adds a new testaw';
  }

  findAll() {
    return `This action returns all testaws`;
  }

  findOne(id: number) {
    return `This action returns a #${id} testaw`;
  }

  update(id: number, updateTestawDto: UpdateTestawDto) {
    return `This action updates a #${id} testaw`;
  }

  remove(id: number) {
    return `This action removes a #${id} testaw`;
  }
}
