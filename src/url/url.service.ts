import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { ClickDto, CreateUrlDto, EditUrlDto } from './dtos';
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

  async createUrl({ longUrl, customDomain, title }: CreateUrlDto, user: User) {
    try {
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
          title,
        },
      });

      return result;
    } catch (error) {
      return { message: error.message };
    }
  }

  async getLongUrl(shortUrl: string, req: Request): Promise<string> {
    const cacheKey = 'createurl';

    const cachedResult = await this.cacheService.get(cacheKey);

    if (cachedResult) return cachedResult;

    const url = await this.prisma.url.findUnique({ where: { shortUrl } });

    if (!url) {
      throw new NotFoundException('Invalid URL!');
    }

    await this.updateClicks(url, req);
    await this.cacheService.set(cacheKey, url.longUrl);

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

  async editUrl(id: string, { title, longUrl }: EditUrlDto) {
    try {
      const url = await this.prisma.url.findUnique({ where: { id } });

      if (!url) throw new ForbiddenException('Url not found!');

      await this.prisma.url.update({
        where: { id },
        data: { title, longUrl },
      });

      await this.cacheService.reset();
      return { message: 'Updated successfully' };
    } catch (error) {
      return { message: error.message };
    }
  }

  async deleteUrl(id: string) {
    try {
      const url = await this.prisma.url.findUnique({ where: { id } });

      if (!url)
        throw new ForbiddenException('Unable to delete url. Url not found!');

      await this.prisma.click.deleteMany({ where: { urlId: id } });

      await this.prisma.url.delete({ where: { id } });

      await this.cacheService.reset();
      return { message: 'Url deleted successfully' };
    } catch (error) {
      throw new ForbiddenException(error.message);
    }
  }
}
