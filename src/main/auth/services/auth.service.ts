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

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly utils: UtilsService,
    private readonly mail: MailService,
    private readonly jwt: JwtService,
  ) {}

  // ---------- ----------REGISTER (send email verification OTP) ----------

  @HandleError('Failed to Register profile', 'Register ')
  async register(payload: RegisterDto) {
    const { email, password, confirmPassword, fullName } = payload;

    // Check if passwords match
    if (password !== confirmPassword) {
      throw new AppError(400, 'Passwords do not match');
    }

    // Check if user already exists
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new AppError(400, 'User already exists with this email');
    }

    // Hash the password
    const hashedPassword = await this.utils.hash(password);

    // Create new user
    const newUser = await this.prisma.user.create({
      data: {
        email,
        fullName,
        password: hashedPassword,
        isVerified: false,
      },
    });

    // Generate OTP
    const { otp, expiryTime } = this.utils.generateOtpAndExpiry();

    // Store OTP and expiry in user record
    await this.prisma.user.update({
      where: { id: newUser.id },
      data: {
        emailOtp: otp,
        otpExpiry: expiryTime,
      },
    });

    // Send OTP email
    await this.mail.sendEmail(
      email,
      'Verify Your Email',
      `
      <h3>Hi,</h3>
      <p>Use the OTP below to verify your email:</p>
      <h2>${otp}</h2>
      <p>This OTP will expire in 10 minutes.</p>
    `,
    );

    // Generate JWT token for verification
    const jwtPayload = { id: newUser.id };
    const resetToken = await this.jwt.signAsync(jwtPayload, {
      expiresIn: '10m',
    });

    return { resetToken };
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

  //  ------------------forgot passowrd--------------

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
      'Verify Your Email',
      `
      <h3>Hi,</h3>
      <p>Use the OTP below to verify your email:</p>
      <h2>${otp}</h2>
      <p>This OTP will expire in 10 minutes.</p>
    `,
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
