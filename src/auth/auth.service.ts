import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import * as argon from 'argon2';
import {
  ChangePasswordDto,
  CreateUserDto,
  GoogleAuthDto,
  RefreshTokenDto,
  SigninUserDto,
} from './dtos';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { RefreshTokenService } from 'src/auth/refresh-token.service';
import { User } from '@prisma/client';
import { MailerService } from 'src/common/mailer/mailer.service';
import { TokenService } from 'src/common/token/token.service';
import { TokenType } from 'src/common/token/enums';
import { ConfirmEmailDto } from './dtos/confirm-email.dto';
import { GoogleStrategy } from './strategies';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private config: ConfigService,
    private googleStrategy: GoogleStrategy,
    private refreshTokenService: RefreshTokenService,
    private mailerService: MailerService,
    private tokenService: TokenService,
  ) {}

  async createUser({ email, password, firstName, lastName }: CreateUserDto) {
    const hash = await argon.hash(password);
    try {
      const user = await this.prisma.user.create({
        data: {
          email,
          password: hash,
          firstName,
          lastName,
        },
      });
      delete user.password;

      const token = await this.tokenService.createToken(
        TokenType.EMAIL_VERIFICATION,
        user.email,
        10 * 60 * 1000,
      );

      await this.mailerService.sendConfirmEmailMessage(user, token);

      return { message: 'Registration Successful', user };
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ForbiddenException('Email address already exists');
      }

      throw error;
    }
  }

  async newToken(id: string, type: TokenType) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    const token = await this.tokenService.createToken(
      type,
      user.email,
      10 * 60 * 1000,
    );

    await this.mailerService.sendConfirmEmailMessage(user, token);
    return { message: 'One Time Password resent' };
  }

  async confirmEmail(id: string, { token }: ConfirmEmailDto) {
    const user = await this.prisma.user.findUnique({ where: { id } });

    if (!user)
      throw new BadRequestException('Unable to verify your email address.');

    if (user.verified) {
      throw new BadRequestException('Email already verified!');
    }

    const verify = await this.tokenService.verifyToken(
      TokenType.EMAIL_VERIFICATION,
      token,
      user.email,
    );

    if (!verify)
      throw new BadRequestException(
        'Unable to verify your email address at this time',
      );

    await this.prisma.user.update({ where: { id }, data: { verified: true } });
    await this.mailerService.sendEmailConfirmed(user);

    return { message: 'Email verification successful!' };
  }

  async findOrCreate(dto: GoogleAuthDto) {
    let user = await this.prisma.user.findFirst({
      where: { email: dto.email },
    });

    if (!user) {
      const newUser = await this.prisma.user.create({
        data: {
          ...dto,
          password: 'b5f6f398333322a992fc9a3dcd5840e5',
          googleAuth: true,
          verified: true,
        },
      });
      user = newUser;
    }

    delete user.password;
    return user;
  }

  async signinUser({ email, password }: SigninUserDto) {
    const user = await this.prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (!user)
      throw new ForbiddenException('Invalid credentials. User not found');

    if (user.googleAuth)
      throw new ForbiddenException(
        'Cannot sign in with password. Kindly sign in with Google',
      );

    const matchedPW = await argon.verify(user.password, password);

    if (!matchedPW) throw new UnauthorizedException('Incorrect Password');

    delete user.password;

    const accessToken = await this.generateAccessToken(user.id, user.email);
    const refreshToken = await this.generateRefreshToken(user.id);

    return { user, accessToken, refreshToken };
  }

  async googleLogin(req: any) {
    if (!req.user) {
      return 'No google account found!';
    }

    const user = await this.findOrCreate(req.user.user);

    const accessToken = await this.generateAccessToken(user.id, user.email);
    const refreshToken = await this.generateRefreshToken(user.id);

    return { user, accessToken, refreshToken };
  }

  async googleClientAuth(access_token: string) {
    try {
      const googleUser = await this.googleStrategy.clientValidate(access_token);

      const user = await this.findOrCreate(googleUser);

      const accessToken = await this.generateAccessToken(user.id, user.email);
      const refreshToken = await this.generateRefreshToken(user.id);

      return { user, accessToken, refreshToken };
    } catch (error) {
      throw new UnauthorizedException('Google Authentication Failed');
    }
  }

  async changePassword(
    { currentPassword, newPassword }: ChangePasswordDto,
    { email }: User,
  ) {
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (user.googleAuth)
      throw new ForbiddenException(
        'Cannot change password because you are a google authenticated user',
      );

    const matchedPW = await argon.verify(user.password, currentPassword);

    if (!matchedPW)
      throw new ForbiddenException('Current Password is Incorrect');

    const hash = await argon.hash(newPassword);

    await this.prisma.user.update({
      where: { email },
      data: { password: hash },
    });

    delete user.password;
    return { message: 'Password changed successfully!', user };
  }

  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (!user) throw new BadRequestException('Invalid Email');

    const token = await this.tokenService.createToken(
      TokenType.PASSWORD_RESET,
      user.email,
      10 * 60 * 1000,
    );

    const mail = await this.mailerService.sendResetEmail(user, token);
    return { message: mail, user };
  }

  async resetPassword(userId: string, token: string, newPassword: string) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId },
    });

    await this.tokenService.verifyToken(
      TokenType.PASSWORD_RESET,
      token,
      user.email,
    );

    const hash = await argon.hash(newPassword);

    await this.prisma.user.update({
      where: { email: user.email },
      data: { password: hash },
    });

    await this.mailerService.sendResetSuccessfulEmail(user);
    return { message: 'Password reset successfully!' };
  }

  async generateAccessToken(userId: string, email: string): Promise<string> {
    const payload = {
      sub: userId,
      email,
    };

    const secret = this.config.get('JWT_SECRET');

    const options = {
      expiresIn: '1h',
      secret,
    };

    return this.jwtService.signAsync(payload, options);
  }

  async generateRefreshToken(userId: string) {
    const refreshToken = await this.refreshTokenService.create(userId);

    return refreshToken;
  }

  async refreshTokens({ refreshToken }: RefreshTokenDto) {
    try {
      const decoded = this.jwtService.verify(refreshToken, {
        secret: this.config.get('JWT_REFRESH_SECRET'),
      });
      const { sub, email } = decoded;

      const isRefreshTokenValid =
        await this.refreshTokenService.isRefreshTokenValid(sub, refreshToken);
      if (!isRefreshTokenValid) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const accessToken = await this.generateAccessToken(sub, email);

      return {
        accessToken,
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logoutUser(userId: string) {
    await this.refreshTokenService.deleteRefreshToken(userId);

    return { message: 'Logout successful!' };
  }
}
