import {
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

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private config: ConfigService,
    private refreshTokenService: RefreshTokenService,
    private mailerService: MailerService,
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

      const token = Math.floor(Math.random() * 900000) + 1000;

      await this.mailerService.sendConfirmEmailMessage(user, token);
      return user;
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ForbiddenException('Email address already exists');
      }

      throw error;
    }
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

    if (!user) throw new ForbiddenException('User not found');

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

    if (!matchedPW) throw new ForbiddenException('Incorrect Password');

    const hash = await argon.hash(newPassword);

    await this.prisma.user.update({
      where: { email },
      data: { password: hash },
    });

    delete user.password;
    return { message: 'Password changed successfully!', user };
  }

  async generateAccessToken(userId: string, email: string): Promise<string> {
    const payload = {
      sub: userId,
      email,
    };

    const secret = this.config.get('JWT_SECRET');

    const options = {
      expiresIn: '15m',
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
      // const newRefreshToken = await this.generateRefreshToken(sub);

      return {
        accessToken,
        // refreshToken: newRefreshToken,
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }
}
