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
          shortUrl,
          userId: user.id,
          title,
        },
      });

      if (customDomain) {
        const existingDomain = await this.prisma.customDomain.findFirst({
          where: { domain: customDomain },
        });

        if (!existingDomain) {
          await this.prisma.customDomain.create({
            data: { domain: customDomain, url: { connect: { id: result.id } } },
          });
        }
      }

      return result;
    } catch (error) {
      return { message: error.message };
    }
  }

  async getLongUrl(
    shortUrl: string,
    req: Request,
    customDomain: string,
  ): Promise<string> {
    const cacheKey = 'longurl';

    const cachedResult = await this.cacheService.get(cacheKey);

    if (cachedResult) {
      return cachedResult;
    }

    let url: Url;

    if (customDomain !== undefined) {
      url = await this.prisma.url.findFirst({
        where: {
          shortUrl,
          status: true,
        },
      });
    } else {
      url = await this.prisma.url.findFirst({
        where: {
          shortUrl,
          status: true,
          customDomain: { domain: customDomain },
        },
      });
    }

    if (!url) {
      throw new ForbiddenException('Invalid URL!');
    }

    await this.updateClickCount(shortUrl);
    await this.saveDeviceInfo(url.id, req);
    await this.cacheService.set(cacheKey, url.longUrl);

    return url.longUrl;
  }

  async updateClickCount(shortUrl: string): Promise<void> {
    const url = await this.prisma.url.findUnique({ where: { shortUrl } });

    if (!url) {
      throw new ForbiddenException('Invalid URL!');
    }

    await this.prisma.url.update({
      where: { id: url.id },
      data: {
        clicks: {
          increment: 1,
        },
      },
    });
  }

  async saveDeviceInfo(urlId: string, req: Request): Promise<void> {
    const { platform, browser, os, version } = req.useragent;
    const timestamp = new Date();
    const userOS = `${os} ${version}`;

    const clickDto: ClickDto = {
      timestamp,
      device: platform,
      os: userOS,
      browser,
      ipAddress: req.clientIp,
    };

    await this.prisma.click.create({
      data: {
        urlId,
        ...clickDto,
      },
    });
  }

  async editUrl(id: string, { title, longUrl }: EditUrlDto) {
    try {
      const url = await this.prisma.url.findUnique({ where: { id } });

      if (!url) throw new ForbiddenException('URL not found!');

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

  async updateUrlStatus(id: string, query: 'true' | 'false') {
    try {
      const url = await this.prisma.url.findUnique({ where: { id } });
      if (!url) throw new NotFoundException('URL not found');

      await this.prisma.url.update({
        where: { id },
        data: { status: query === 'true' ? true : false },
      });
    } catch (error) {}
  }

  async deleteUrl(id: string) {
    try {
      const url = await this.prisma.url.findUnique({ where: { id } });

      if (!url)
        throw new ForbiddenException('Unable to delete url. URL not found!');

      await this.prisma.click.deleteMany({ where: { urlId: id } });

      await this.prisma.url.delete({ where: { id } });

      await this.prisma.qrCode.delete({ where: { id } });

      await this.cacheService.reset();
      return { message: 'Url deleted successfully' };
    } catch (error) {
      throw new ForbiddenException(error.message);
    }
  }
}
