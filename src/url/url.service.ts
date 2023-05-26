import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { ClickDto, CreateUrlDto } from './dtos';
import { Url, User } from '@prisma/client';
import { ShortCodeUtility } from 'src/common/utilities';
import { CacheService } from 'src/common/cache/cache.service';
import { Request } from 'express';

@Injectable()
export class UrlService {
  constructor(
    private prisma: PrismaService,
    private cacheService: CacheService,
  ) {}

  async createUrl({ longUrl, customDomain }: CreateUrlDto, user: User) {
    try {
      const cacheKey = 'createurl';

      const cachedResult = await this.cacheService.get(cacheKey);

      if (cachedResult) return cachedResult;

      const existingLongUrl = await this.prisma.url.findFirst({
        where: { longUrl },
      });

      if (existingLongUrl)
        throw new ForbiddenException(`${longUrl} already shortened`);

      let shortUrl = ShortCodeUtility.generateShortCode(6);
      let existingUrl = await this.prisma.url.findFirst({
        where: { shortUrl },
      });

      while (existingUrl) {
        shortUrl = ShortCodeUtility.generateShortCode(6);
        existingUrl = await this.prisma.url.findFirst({
          where: { shortUrl },
        });
      }

      const result = await this.prisma.url.create({
        data: {
          longUrl,
          customDomain,
          shortUrl,
          userId: user.id,
        },
      });

      await this.cacheService.set(cacheKey, result);
      return result;
    } catch (error) {
      throw error;
    }
  }

  async getLongUrl(shortUrl: string, req: Request): Promise<string> {
    const url = await this.prisma.url.findUnique({ where: { shortUrl } });

    if (!url) {
      throw new NotFoundException('Short URL not found');
    }
    await this.updateClicks(url, req);
    return url.longUrl;
  }

  async updateClicks({ shortUrl, id }: Url, req: Request): Promise<void> {
    const clickDto: ClickDto = {
      timestamp: new Date(),
      userAgent: req.headers['user-agent'],
      ipAddress: req.ip,
    };
    await this.prisma.click.create({
      data: { ...clickDto, urlId: id },
    });
    await this.prisma.url.update({
      where: { shortUrl },
      data: {
        clicks: {
          increment: 1,
        },
      },
    });
  }
}
