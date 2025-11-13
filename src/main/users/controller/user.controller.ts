import {
  Controller,
  Post,
  Body,
  Patch,
  UseInterceptors,
  UploadedFile,
  Get,
  UploadedFiles,
  Req,
} from '@nestjs/common';

import {
  ApiBearerAuth,
  ApiConsumes,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { FileType, MulterService } from 'src/lib/multer/multer.service';

import { UpdateProfileDto } from '../dto/update.profile.dto';

import {
  GetUser,
  ValidateAdmin,
  ValidateAuth,
} from 'src/common/jwt/jwt.decorator';
import { UpdatePasswordDto } from '../dto/updatepassword.dto';
import { UserService } from '../service/user.service';

import uploadFileToS3 from 'src/lib/utils/uploadImageAWS';
@ApiTags('USER Profile Maintain')
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @ApiOperation({ summary: 'Update user profile' })
  @ValidateAuth()
  @ApiBearerAuth()
  @Patch('profile')
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
  async updateProfile(
    @GetUser('userId') userId: string,
    @Body() dto: UpdateProfileDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    console.log('The user id is', userId);

    let s3Result: { url: string; key: string } | undefined;

    if (file) {
      //  Upload to S3
      s3Result = await uploadFileToS3(file.path);
      console.log(' Uploaded to S3:', s3Result.url);

      // Remove local file after successful upload
      try {
        const fs = await import('fs/promises');
        await fs.unlink(file.path);
        console.log(' Local file deleted:', file.path);
      } catch (err) {
        console.warn(' Failed to delete local file:', err);
      }
    }

    // Pass s3Result to service
    return await this.userService.updateProfile(userId, dto, s3Result);
  }

  // ----------------update password--------------------
  @ApiOperation({ summary: 'Update user password' })
  @ValidateAuth()
  @ApiBearerAuth()
  @Post('me/update-password')
  async getProfile(
    @GetUser('userId') userId: string,
    @Body() body: UpdatePasswordDto,
  ) {
    console.log('use id', userId);
    return this.userService.updatePassword(userId, body);
  }
  // ----------------get profile--------------------

  @ApiOperation({ summary: 'Get user there owner  data ' })
  @ValidateAuth()
  @ApiBearerAuth()
  @Get('me/profile')
  async getUserData(@GetUser('userId') userId: string) {
    return this.userService.getProfile(userId);
  }
  // ------------get all user for admin------------
  @ApiOperation({ summary: 'Get all users only admin or super admin access' })
  @ValidateAdmin()
  @ApiBearerAuth()
  @Get('all')
  async getAllUsers() {
    return this.userService.getAllUsers();
  }
  // ------------------------ user apply for contibutor--================----------

  // ---------------------user report Contents----------------
  // @ApiOperation({ summary: 'Create Report with multiple screenshots' })
  // @ApiBearerAuth()
  // @ValidateAuth()
  // @Post('create-report')
  // @ApiConsumes('multipart/form-data')
  // @UseInterceptors(
  //   FilesInterceptor(
  //     'files', // note: plural for multiple files
  //     5, // max files, adjust as needed
  //     new MulterService().createMulterOptions(
  //       './uploads',
  //       'content',
  //       FileType.ANY,
  //     ),
  //   ),
  // )
  // async create(
  //   @Body() createReportDto: CreateReportDto,
  //   @UploadedFiles() files: Express.Multer.File[],
  //   @GetUser('userId') userId: string,
  // ) {
  //   let s3Files: { url: string; key: string }[] = [];

  //   if (files && files.length) {
  //     // Upload all files to S3 and delete local copies
  //     for (const file of files) {
  //       const s3Result = await uploadFileToS3(file.path);
  //       s3Files.push(s3Result);

  //       // Delete local file
  //       try {
  //         const fs = await import('fs/promises');
  //         await fs.unlink(file.path);
  //       } catch (err) {
  //         console.warn('⚠️ Failed to delete local file:', err);
  //       }
  //     }

  //     // Pass S3 URLs to DTO
  //     createReportDto.files = s3Files.map((f) => ({ url: f.url, key: f.key }));
  //   }

  //   return this.userService.createReport(createReportDto, userId);
  // }

  // --------Review Alerts---

  @ApiBearerAuth()
  @ValidateAuth()
  @ApiOperation({ summary: 'Toggle Review Alerts for logged-in user' })
  @Patch('toggle-review-alerts')
  changeReviewAlert(@GetUser('userId') userId: string) {
    return this.userService.changeReviewAlert(userId);
  }
}
