import { Controller, Get, Param, Redirect, Req } from '@nestjs/common';
import { UrlService } from './url/url.service';
import { Request } from 'express';

@Controller()
export class AppController {
  constructor(private urlService: UrlService) {}
  @Get()
  getHello(): string {
    return 'Hello World';
  }

  @Get(':shortUrl')
  @Redirect('', 301)
  async getLongUrl(@Param('shortUrl') shortUrl: string, @Req() req: Request) {
    await this.urlService.updateClickCount(shortUrl);

    const longUrl = await this.urlService.getLongUrl(shortUrl, req);

    return { url: longUrl };
  }
}
