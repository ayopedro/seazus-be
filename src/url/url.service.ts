import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateUrlDto } from './dtos';
import { User } from '@prisma/client';
import { ShortCodeUtility } from 'src/common/utilities';
import { CacheService } from 'src/common/cache/cache.service';

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
}
