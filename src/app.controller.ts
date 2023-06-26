import { Controller, Get, Param, Redirect, Req } from '@nestjs/common';
import { UrlService } from './url/url.service';
import { Request } from 'express';

@Controller()
export class AppController {
  constructor(private urlService: UrlService) {}
  @Get()
  getHello(): string {
    return 'Welcome to SEAZUS. Shorten your long URLs on https://seazus.vercel.app';
  }

  @Get(':shortUrl')
  @Redirect('', 301)
  async getLongUrl(@Param('shortUrl') shortUrl: string, @Req() req: Request) {
    const { hostname } = req;
    const longUrl = await this.urlService.getLongUrl(
      shortUrl,
      req,
      hostname !== 'seazus.onrender.com' && hostname,
    );

    return { url: longUrl };
  }
}
