import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OAuth2Client, TokenPayload } from 'google-auth-library';
import { GoogleLoginDto } from '../dto/google-login.dto';
import { PrismaService } from 'src/lib/prisma/prisma.service';
import { UtilsService } from 'src/lib/utils/utils.service';
import { ENVEnum } from 'src/common/enum/env.enum';
import { HandleError } from 'src/common/error/handle-error.decorator';
import {
  successResponse,
  TResponse,
} from 'src/common/utilsResponse/response.util';
import { AppError } from 'src/common/error/handle-error.app';
import { UserResponseDto } from 'src/common/dto/user-response.dto';
import { UserRole } from '@prisma/client';

@Injectable()
export class AuthGoogleService {
  private googleClient: OAuth2Client;

  constructor(
    private readonly prisma: PrismaService,
    private readonly utils: UtilsService,
    private readonly configService: ConfigService,
  ) {
    this.googleClient = new OAuth2Client(
      this.configService.get<string>(ENVEnum.OAUTH_CLIENT_ID),
    );
  }

  @HandleError('Google login failed', 'User')
  async googleLogin(dto: GoogleLoginDto): Promise<TResponse<any>> {
    const { idToken } = dto;

    if (!idToken) {
      throw new AppError(400, 'Google ID token is required');
    }

    // Step 1: Verify Google token
    const payload = await this.verifyGoogleIdToken(idToken);

    // Step 2: Find user by email
    let user = await this.prisma.user.findUnique({
      where: { email: payload.email },
    });

    // Step 3: If user not found, create one
    if (!user) {
      user = await this.prisma.user.create({
        data: {
          email: payload.email as string,
          fullName: payload.name || '',
          googleId: payload.sub,
          isVerified: true,
          role: UserRole.CAR_OWNER, // Default role for Google login users
          isActive: true,
          isDeleted: false,
        },
      });
    } else if (!user.googleId) {
      // Step 4: Link Google account if exists but not linked
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: {
          googleId: payload.sub,
          isVerified: true,
        },
      });
    }

    // Step 5: Generate JWT token
    const token = this.utils.generateToken({
      sub: user.id,
      email: user.email,
      roles: user.role,
    });

    // Step 6: Return sanitized user + token
    return successResponse(
      {
        user: this.utils.sanitizedResponse(UserResponseDto, user),
        token,
      },
      'User logged in successfully via Google',
    );
  }

  // Verify the Google ID Token and extract user info
  private async verifyGoogleIdToken(idToken: string): Promise<TokenPayload> {
    const ticket = await this.googleClient.verifyIdToken({
      idToken,
      audience: this.configService.get<string>(ENVEnum.OAUTH_CLIENT_ID),
    });

    const payload = ticket.getPayload();

    if (!payload) {
      throw new AppError(400, 'Invalid Google token');
    }

    const { sub, email } = payload;

    if (!email || !sub) {
      throw new AppError(
        400,
        'Google token does not contain required user information',
      );
    }

    return payload;
  }
}
