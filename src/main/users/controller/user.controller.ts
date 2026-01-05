import {
  Body,
  Controller,
  Delete,
  Get,
  Patch,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';

import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { FileType, MulterService } from 'src/lib/multer/multer.service';

import { UpdateProfileDto } from '../dto/update.profile.dto';

import {
  GetUser,
  ValidateAdmin,
  ValidateAuth,
} from 'src/common/jwt/jwt.decorator';
import uploadFileToS3 from 'src/lib/utils/uploadImageAWS';
import { UserService } from '../service/user.service';
@ApiTags('USER Profile Maintain')
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) { }

  // ------------get all user for admin------------
  @ApiOperation({ summary: 'Get all users only admin or super admin access' })
  @ValidateAdmin()
  @ApiBearerAuth()
  @Get('all')
  async getAllUsers() {
    return this.userService.getAllUsers();
  }

  // ----------------get profile--------------------

  @ApiOperation({ summary: 'Get user there owner  data  fetching now' })
  @ValidateAuth()
  @ApiBearerAuth()
  @Get('me/profile')
  async getUserData(@GetUser('userId') userId: string) {
    return this.userService.getProfile(userId);
  }

  @ApiOperation({ summary: 'Update user profile with user images now All data' })
  @ValidateAuth()
  @ApiBearerAuth()
  @Patch('profile')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor(
      'file',
      new MulterService().createMulterOptions(
        'user-profile',
        FileType.ANY,
      ),
    ),
  )
  async updateProfile(
    @GetUser('userId') userId: string,
    @Body() dto: UpdateProfileDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    console.log('The user id is more than 1', userId);

    let s3Result: { url: string; key: string } | undefined;

    if (file) {
      //  Upload to S3
      s3Result = await uploadFileToS3(file.path);
      console.log(' Uploaded to S3:', s3Result.url);
      console.log('the s3 url', s3Result)

    }
    console.log('the file', file)

    // -------------- Pass s3-Result to service  -----------------
    return await this.userService.updateProfile(userId, dto, s3Result);
  }


  // -------------hard delete user account----------------
  @ApiBearerAuth()
  @ValidateAuth()
  @ApiOperation({ summary: 'Hard delete user account now with the fix now' })
  @Delete('hard-delete-user-account')
  hardDeleteUserAccount(@GetUser('userId') userId: string) {
    return this.userService.hardDeleteUserAccount(userId);
  }

  // -------------test user email now-------------------
  @ApiBearerAuth()
  @ValidateAuth()
  @ApiOperation({ summary: 'Test user email now' })
  @Get('test-email')
  testEmail(@GetUser('userId') userId: string) {
    return this.userService.testEmail(userId);
  }
}
