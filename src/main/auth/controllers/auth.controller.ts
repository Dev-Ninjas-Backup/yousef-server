import {
  BadRequestException,
  Body,
  Controller,
  HttpStatus,
  Post,
  Res,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { unlink } from 'fs/promises';
import { FileType, MulterService } from 'src/lib/multer/multer.service';
import uploadFileToS3 from 'src/lib/utils/uploadImageAWS';
import { ForgetPasswordAuthDto } from '../dto/forgot-password.dto';
import { GoogleLoginDto } from '../dto/google-login.dto';
import { LoginDto } from '../dto/login.dto';
import { RegisterDto } from '../dto/register.dto';
import { ResetPasswordAuthDto } from '../dto/reset-password';
import { VerifyOtpAuthDto } from '../dto/varify-otp.dto';
import { AuthGoogleService } from '../services/auth-google.service';
import { AuthService } from '../services/auth.service';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly authGoogleService: AuthGoogleService,
  ) {}

  //  -------------- User Registration --------------
  @Post('register')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'garageLogo', maxCount: 1 },
        { name: 'tradeLicense', maxCount: 1 },
      ],
      new MulterService().createMulterOptions(
        './uploads',
        'register',
        FileType.ANY,
      ),
    ),
  )
  async register(
    @Body() body: RegisterDto,
    @UploadedFiles()
    files: {
      garageLogo?: Express.Multer.File[];
      tradeLicense?: Express.Multer.File[];
    },
  ) {
    try {
      let garageLogoUrl: string | undefined;
      let tradeLicenseUrl: string | undefined;

      // Upload garageLogo if present
      if (files?.garageLogo?.[0]) {
        const file = files.garageLogo[0];
        const { url } = await uploadFileToS3(file.path);
        garageLogoUrl = url;

        try {
          await unlink(file.path);
        } catch (err) {
          console.log(err);
        }
      }

      // Upload tradeLicense if present
      if (files?.tradeLicense?.[0]) {
        const file = files.tradeLicense[0];
        const { url } = await uploadFileToS3(file.path);
        tradeLicenseUrl = url;
        try {
          await unlink(file.path);
        } catch (e) {
          console.warn('Failed to delete local file:', e);
        }
      }

      return this.authService.register(body, garageLogoUrl, tradeLicenseUrl);
    } catch (err) {
      // Clean up any local files if something went wrong
      if (files) {
        for (const farr of Object.values(files)) {
          if (!farr) continue;
          for (const f of farr) {
            try {
              await unlink(f.path);
            } catch (err) {
              console.log(err);
            }
          }
        }
      }
      throw new BadRequestException(
        'Failed to register user: ' + (err?.message || err),
      );
    }
  }

  @ApiOperation({ summary: 'User Registration with Google' })
  @Post('login')
  @ApiOperation({ summary: 'User Login with Email' })
  async login(
    @Body() body: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = (await this.authService.login(body)) as any;

    //------- Set HTTP-only cookie---------
    res.cookie('token', result?.data?.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });
    return { result, message: 'Login successful' };
  }

  @ApiOperation({ summary: 'Google Login or Sign Up' })
  @Post('google-login')
  async googleLogin(@Body() body: GoogleLoginDto) {
    return this.authGoogleService.googleLogin(body);
  }

  @ApiOperation({
    summary:
      'User Registration signup-verify-otp or reset-verify-otp or resend otp verification',
  })
  @Post('signup-verify-otp')
  async verifyOtp(@Body() payload: VerifyOtpAuthDto) {
    const result = await this.authService.verifyOtp(payload);
    return {
      statusCode: HttpStatus.OK,
      success: true,
      message: 'OTP verified successfully!',
      data: result,
    };
  }

  // -------------- Reset otp --------------
  @ApiOperation({ summary: 'User Registration reset-verify-otp' })
  @Post('reset-verify-otp')
  async resetverifyOtp(@Body() payload: VerifyOtpAuthDto) {
    const result = await this.authService.verifyOtp(payload);
    return {
      statusCode: HttpStatus.OK,
      success: true,
      message: ' reset OTP verified successfully!',
      data: result,
    };
  }

  // ------------- Resend otp  --------------
  @ApiOperation({ summary: 'forget-password or send resend otp email' })
  @Post('forget-password')
  async forgetPassword(@Body() payload: ForgetPasswordAuthDto) {
    console.log({ payload });
    const result = await this.authService.forgetPassword(payload);
    return {
      statusCode: HttpStatus.OK,
      success: true,
      message: 'Email sent successfully!',
      data: result,
    };
  }
  //  ------------- Reset Password  --------------
  @ApiOperation({ summary: ' reset-password' })
  @Post('reset-password')
  async resetPassword(@Body() payload: ResetPasswordAuthDto) {
    const result = await this.authService.resetPassword(payload);
    return {
      statusCode: HttpStatus.OK,
      success: true,
      message: 'Password reset successfully!',
      data: result,
    };
  }
}
