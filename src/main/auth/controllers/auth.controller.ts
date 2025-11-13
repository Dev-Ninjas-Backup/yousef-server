import { Body, Controller, HttpStatus, Post, Res } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { GoogleLoginDto } from '../dto/google-login.dto';
import { LoginDto } from '../dto/login.dto';
import { RegisterDto } from '../dto/register.dto';
import { AuthService } from '../services/auth.service';
import { AuthGoogleService } from '../services/auth-google.service';

import { VerifyOtpAuthDto } from '../dto/varify-otp.dto';

import { ForgetPasswordAuthDto } from '../dto/forgot-password.dto';
import { ResetPasswordAuthDto } from '../dto/reset-password';
import type { Response } from 'express';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly authGoogleService: AuthGoogleService,
  ) {}

//  -------------- User Registration --------------
  @ApiOperation({ summary: 'User Registration with Email' })
  @Post('register')
  async register(@Body() body: RegisterDto) {
    return this.authService.register(body);
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


@ApiOperation({ summary: 'User Registration signup-verify-otp' })
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


  @ApiOperation({ summary: 'forget-password' })
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

  @ApiOperation({ summary:'reset-password' })
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
