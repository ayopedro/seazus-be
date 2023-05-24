import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import * as argon from 'argon2';
import { CreateUserDto, RefreshTokenDto, SigninUserDto } from './dtos';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { RefreshTokenService } from 'src/auth/refresh-token.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private config: ConfigService,
    private refreshTokenService: RefreshTokenService,
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

      return user;
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ForbiddenException('Email address already exists');
      }

      throw error;
    }
  }

  async signinUser({ email, password }: SigninUserDto) {
    const user = await this.prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (!user) throw new ForbiddenException('User not found');

    const matchedPW = await argon.verify(user.password, password);

    if (!matchedPW) throw new UnauthorizedException('Incorrect Password');

    delete user.password;

    const accessToken = await this.generateAccessToken(user.id, user.email);
    const refreshToken = await this.generateRefreshToken(user.id);

    return { user, accessToken, refreshToken };
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
