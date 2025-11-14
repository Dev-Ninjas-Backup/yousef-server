import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  Res,
} from '@nestjs/common';
import { PrismaService } from 'src/lib/prisma/prisma.service';
import { UtilsService } from 'src/lib/utils/utils.service';
import { MailService } from 'src/lib/mail/mail.service';
import { AppError } from 'src/common/error/handle-error.app';
import {
  successResponse,
  TResponse,
} from 'src/common/utilsResponse/response.util';

import { UserResponseDto } from 'src/common/dto/user-response.dto';
import { JwtService } from '@nestjs/jwt';
import { RegisterDto } from '../dto/register.dto';
import { ForgotPasswordDto } from '../dto/uer.dto';
import { LoginDto } from '../dto/login.dto';
import { VerifyOtpAuthDto } from '../dto/varify-otp.dto';
import { ResetPasswordAuthDto } from '../dto/reset-password';
import { HandleError } from 'src/common/error/handle-error.decorator';
import { OtpEmailTemplate } from 'src/common/email/otp.template';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly utils: UtilsService,
    private readonly mail: MailService,
    private readonly jwt: JwtService,
  ) {}

  // ---------- ----------REGISTER (send email verification OTP) ----------

  @HandleError('Failed to Register profile', 'Register')
  async register(payload: RegisterDto) {
    const {
      email,
      password,
      confirmPassword,
      fullName,
      phone,
      role,
      serviceCategories,
    } = payload;

    console.log('fix the issue', payload);
    // Validate password match
    if (password !== confirmPassword) {
      throw new AppError(400, 'Passwords do not match');
    }

    // Check if user already exists by email or phone
    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [{ email }, { phone }],
      },
    });

    if (existingUser) {
      throw new AppError(
        400,
        'User already exists with this email or phone number',
      );
    }

    // Hash password
    const hashedPassword = await this.utils.hash(password);

    // Setup trial for GARAGE_OWNER (2 months free)
    let trialStart: Date | null = null;
    let trialEnd: Date | null = null;
    let isTrialActive = false;

    if (role === 'GARAGE_OWNER') {
      trialStart = new Date();
      trialEnd = new Date(trialStart);
      trialEnd.setMonth(trialEnd.getMonth() + 2);
      isTrialActive = true;
    }

    // Create new user
    const newUser = await this.prisma.user.create({
      data: {
        fullName,
        email,
        phone,
        password: hashedPassword,
        role,
        serviceCategories: { set: serviceCategories || [] },
        isVerified: false,
        trialStartDate: trialStart,
        trialEndDate: trialEnd,
        isTrialActive,
        freeProductsListing: 0,
      },
    });

    // Generate OTP and expiry
    const { otp, expiryTime } = this.utils.generateOtpAndExpiry();

    // Store OTP + expiry
    await this.prisma.user.update({
      where: { id: newUser.id },
      data: {
        emailOtp: otp,
        otpExpiry: expiryTime,
      },
    });

    // Send verification email
    // Send verification OTP using reusable template
    await this.mail.sendEmail(
      email,
      'Verify Your Email',
      OtpEmailTemplate({
        name: fullName,
        otp,
        purpose: 'Verify Your Email',
      }),
    );

    // Generate JWT token for email verification
    const jwtPayload = { id: newUser.id, email };
    const verifyToken = await this.jwt.signAsync(jwtPayload, {
      expiresIn: '10m',
    });

    return {
      message:
        'Registration successful. Please verify your email with the OTP sent.',
      verifyToken,
    };
  }

  // ---------- LOGIN (require verified) ----------

  @HandleError('Failed to Login profile', 'Login ')
  async login(dto: LoginDto): Promise<TResponse<any>> {
    const { email, password } = dto;

    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new AppError(404, 'User not found');

    if (!user.isVerified)
      throw new AppError(400, 'Please verify your email first');

    if (!user.password)
      throw new AppError(400, 'No password set for this account');

    const isMatch = await this.utils.compare(password, user.password);
    if (!isMatch) throw new AppError(400, 'Invalid credentials');

    const token = this.utils.generateToken({
      sub: user.id,
      email: user.email,
      roles: user.role as any,
    });

    const safeUser = this.utils.sanitizedResponse(UserResponseDto, user);

    return successResponse({ token, user: safeUser }, 'Login successful');
  }

  //  ------------------forgot password--------------

  async forgetPassword(payload: ForgotPasswordDto) {
    const { email } = payload;

    // Find user by email
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new NotFoundException('User does not exist!');
    }

    // Generate OTP
    const { otp, expiryTime } = this.utils.generateOtpAndExpiry();

    // Store OTP and expiry in user record
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        emailOtp: otp,
        otpExpiry: expiryTime,
      },
    });

    // Send OTP email
    await this.mail.sendEmail(
      email,
      'Reset Password Verification',
      OtpEmailTemplate({
        otp,
        purpose: 'Reset Your Password',
      }),
    );

    // Generate JWT token for verification
    const jwtPayload = { id: user.id };
    const resetToken = await this.jwt.signAsync(jwtPayload, {
      expiresIn: '10m',
    });

    return { resetToken };
  }
  // --------------------------------------------- with token varify otp signup token ----------------------------------
  async verifyOtp(payload: VerifyOtpAuthDto) {
    // Verify the JWT token
    let decoded: any;
    try {
      decoded = await this.jwt.verifyAsync(payload.resetToken);
    } catch (err) {
      throw new ForbiddenException('Invalid or expired token!');
    }

    // Find user by ID from the token
    const user = await this.prisma.user.findUnique({
      where: { id: decoded.id },
    });

    if (!user) {
      throw new ForbiddenException('User not found!');
    }

    // Check OTP match
    if (user.emailOtp !== parseInt(payload.emailOtp)) {
      throw new ForbiddenException('OTP does not match!');
    }

    // Clear OTP and expiry, mark as verified
    const updatedUser = await this.prisma.user.update({
      where: { id: user.id },
      data: {
        emailOtp: null,
        otpExpiry: null,
        isVerified: true,
      },
    });

    // Generate a new JWT token
    // const jwtPayload = {
    //   id: updatedUser.id,
    //   email: updatedUser.email,
    //   roles: updatedUser.role,
    // };
    const token = await this.jwt.signAsync(
      { id: user.id, email: user.email, roles: user.role },
      { secret: process.env.JWT_SECRET, expiresIn: '77d' },
    );

    return {
      success: true,
      message: 'OTP verified successfully',
      data: {
        token,
        user: updatedUser,
      },
    };
  }

  // -----------------------reset varify otp------------------
  async resetverifyOtp(payload: VerifyOtpAuthDto) {
    // Verify the JWT token
    let decoded: any;
    try {
      decoded = await this.jwt.verifyAsync(payload.resetToken);
    } catch (err) {
      throw new ForbiddenException('Invalid or expired token!');
    }

    // Find user by ID from the token
    const user = await this.prisma.user.findUnique({
      where: { id: decoded.id },
    });

    if (!user) {
      throw new ForbiddenException('User not found!');
    }

    // Check OTP match
    if (user.emailOtp !== parseInt(payload.emailOtp)) {
      throw new ForbiddenException('OTP does not match!');
    }

    // Clear OTP and expiry
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        emailOtp: null,
        otpExpiry: null,
        isVerified: true,
      },
    });

    // Generate a new JWT token
    const jwtPayload = { id: user.id };
    const resetToken = await this.jwt.signAsync(jwtPayload, {
      expiresIn: '10m',
    });

    return { resetToken };
  }

  // -----Reset password using a valid reset token--------------
  async resetPassword(payload: ResetPasswordAuthDto) {
    // Verify token
    let decoded: any;
    try {
      decoded = await this.jwt.verifyAsync(payload.resetToken);
    } catch (err) {
      throw new ForbiddenException('Invalid or expired token!');
    }

    // Find user by ID
    const user = await this.prisma.user.findUnique({
      where: { id: decoded.id },
    });

    if (!user) {
      throw new NotFoundException('User not found!');
    }

    // Hash new password
    const hashedPassword = await this.utils.hash(payload.password);

    // Update user password
    await this.prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    return { message: 'Password reset successfully' };
  }
}
