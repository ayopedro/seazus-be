import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class RefreshTokenService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private config: ConfigService,
  ) {}

  async create(userId: string) {
    const { id, email } = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
    });
    const refreshToken = await this.generateRefreshToken(id, email);

    function addDaysToDate(days: number): Date {
      const currentDate = new Date();
      currentDate.setDate(currentDate.getDate() + days);
      return currentDate;
    }

    await this.prisma.refreshToken.create({
      data: {
        userId,
        token: refreshToken,
        expiresAt: addDaysToDate(1),
      },
    });

    return refreshToken;
  }

  async isRefreshTokenValid(
    userId: string,
    refreshToken: string,
  ): Promise<boolean> {
    const refreshTokenExists = await this.refreshTokenExists(
      userId,
      refreshToken,
    );
    if (!refreshTokenExists) {
      return false;
    }

    const refreshTokenData = await this.getRefreshToken(userId, refreshToken);
    if (!refreshTokenData) {
      return false;
    }

    const { expiresAt } = refreshTokenData;
    const currentTime = new Date();
    return expiresAt > currentTime;
  }

  async generateRefreshToken(id: string, email: string): Promise<string> {
    const payload = { sub: id, email };

    const secret = this.config.get('JWT_REFRESH_SECRET');

    const options = {
      expiresIn: '1d',
      secret,
    };

    return this.jwtService.signAsync(payload, options);
  }

  private async refreshTokenExists(
    userId: string,
    refreshToken: string,
  ): Promise<boolean> {
    const refreshTokenCount = await this.prisma.refreshToken.count({
      where: {
        userId,
        token: refreshToken,
      },
    });

    return refreshTokenCount > 0;
  }

  private async getRefreshToken(userId: string, refreshToken: string) {
    return this.prisma.refreshToken.findFirst({
      where: {
        userId,
        token: refreshToken,
      },
    });
  }

  async deleteRefreshToken(userId: string) {
    return await this.prisma.refreshToken.deleteMany({
      where: {
        userId,
      },
    });
  }
}
