import { S3 } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { Injectable, InternalServerErrorException, OnModuleInit } from '@nestjs/common';
import * as fs from 'fs/promises';
import * as mime from 'mime-types';
import * as path from 'path';
import { ensureUploadDirectory } from './ensure-upload-dir';

@Injectable()
export class AdditionalS3Service implements OnModuleInit {
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

  async onModuleInit() {
    await ensureUploadDirectory();
  }

  async uploadFileToS3(localFilePath: string, prefix: string) {
    // Resolve absolute path
    const absolutePath = path.isAbsolute(localFilePath)
      ? localFilePath
      : path.join(process.cwd(), localFilePath);

    console.log(`📂 Attempting to access file: ${absolutePath}`);

    // First check if file exists
    let fileStats;
    try {
      fileStats = await fs.stat(absolutePath);
      console.log(`📊 File stats:`, {
        size: fileStats.size,
        mode: fileStats.mode.toString(8),
        uid: fileStats.uid,
        gid: fileStats.gid,
      });
    } catch (error) {
      console.error(`❌ File does not exist: ${absolutePath}`, error);
      throw new InternalServerErrorException(
        `File not found: ${localFilePath}`,
      );
    }

    // Try to fix permissions (may fail but continue anyway)
    try {
      await fs.chmod(absolutePath, 0o666);
      console.log(`✅ Changed file permissions to 666`);
    } catch (chmodError) {
      console.warn(`⚠️ Could not change permissions (continuing anyway):`, chmodError.message);
    }

    // Read file into buffer
    let fileContent: Buffer;
    try {
      fileContent = await fs.readFile(absolutePath);
      console.log(`✅ Successfully read file: ${fileContent.length} bytes`);
    } catch (error) {
      console.error(`❌ Failed to read file: ${absolutePath}`, error);

      // Try one more time with sudo-like approach (read with different strategy)
      try {
        const fsSync = require('fs');
        fileContent = fsSync.readFileSync(absolutePath);
        console.log(`✅ Read file using sync method: ${fileContent.length} bytes`);
      } catch (syncError) {
        console.error(`❌ Sync read also failed:`, syncError);
        throw new InternalServerErrorException(
          `Cannot read file - permission denied. File: ${localFilePath}. Please check file permissions.`,
        );
      }
    }

    const fileExt = path.extname(absolutePath);
    const fileName = `${prefix}-${path.basename(absolutePath)}`;
    const mimeType = mime.lookup(fileExt) || 'application/octet-stream';

    try {
      const upload = new Upload({
        client: this.s3,
        params: {
          Bucket: process.env.BUCKET_NAME!,
          Key: fileName,
          Body: fileContent,
          ContentType: mimeType,
        },
      });

      const result = await upload.done();
      console.log(`Successfully uploaded to S3: ${result.Location}`);

      // Delete local file after successful upload
      try {
        await fs.unlink(absolutePath);
        console.log(` Deleted local file: ${absolutePath}`);
      } catch (unlinkError) {
        console.error(
          ` Failed to delete local file: ${absolutePath}`,
          unlinkError,
        );
      }

      return {
        url: result.Location,
        key: fileName,
      };
    } catch (error) {
      console.error(' Upload failed:', error);
      // Try to clean up the local file
      try {
        await fs.unlink(absolutePath);
      } catch (unlinkError) {
        console.error(
          ` Failed to delete local file after error: ${absolutePath}`,
        );
      }
      throw new InternalServerErrorException(
        `Upload to S3 failed: ${error.message}`,
      );
    }
  }

}
