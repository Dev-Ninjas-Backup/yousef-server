import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AppError } from 'src/common/error/handle-error.app';
import {
  successResponse,
  TResponse,
} from 'src/common/utilsResponse/response.util';
import { MailService } from 'src/lib/mail/mail.service';
import { PrismaService } from 'src/lib/prisma/prisma.service';
import { UtilsService } from 'src/lib/utils/utils.service';

import { JwtService } from '@nestjs/jwt';
import { UserResponseDto } from 'src/common/dto/user-response.dto';
import { OtpEmailTemplate } from 'src/common/email/otp.template';
import { HandleError } from 'src/common/error/handle-error.decorator';
import { LoginDto } from '../dto/login.dto';
import { RegisterDto } from '../dto/register.dto';
import { ResetPasswordAuthDto } from '../dto/reset-password';
import { ForgotPasswordDto } from '../dto/uer.dto';
import { VerifyOtpAuthDto } from '../dto/varify-otp.dto';

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
  @HandleError('Failed to Register profile', 'Register')
  async register(
    payload: RegisterDto,
    garageLogo?: string,
    tradeLicense?: string,
  ) {
    const {
      email,
      password,
      confirmPassword,
      fullName,
      phone,

      serviceCategories,
    } = payload;

    if (password !== confirmPassword) {
      throw new BadRequestException('Passwords do not match');
    }

    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [{ email }, { phone }],
      },
    });

    if (existingUser) {
      throw new BadRequestException(
        'User already exists with this email or phone number',
      );
    }

    const hashedPassword = await this.utils.hash(password);

    // Setup trial only for GARAGE_OWNER
    const trialStart: Date | null = null;
    const trialEnd: Date | null = null;
    const isTrialActive = false;

    // serviceCategories must be provided for GARAGE_OWNER (DTO enforced).
    // Prisma expects enum array for `serviceCategories` field — assign set: serviceCategories or empty
    const categoriesToSet = Array.isArray(serviceCategories)
      ? serviceCategories
      : [];

    const newUser = await this.prisma.user.create({
      data: {
        fullName,
        email,
        phone,
        password: hashedPassword,
        serviceCategories: { set: categoriesToSet },
        isVerified: false,
        trialStartDate: trialStart,
        trialEndDate: trialEnd,
        isTrialActive,
        freeProductsListing: 0,
        garageLogo: garageLogo ?? null,
        tradeLicense: tradeLicense ?? null,
      },
    });

    // Generate and store OTP
    const { otp, expiryTime } = this.utils.generateOtpAndExpiry();
    await this.prisma.user.update({
      where: { id: newUser.id },
      data: {
        emailOtp: otp,
        otpExpiry: expiryTime,
      },
    });

    // Send email
    await this.mail.sendEmail(
      email,
      'Verify Your Email',
      OtpEmailTemplate({
        name: fullName,
        otp,
        purpose: 'Verify Your Email',
      }),
    );

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
      throw new ForbiddenException(err.message ?? 'Invalid or expired token!');
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
      throw new ForbiddenException(err.message ?? 'Invalid or expired token!');
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
      throw new ForbiddenException(err.message ?? 'Invalid or expired token!');
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
