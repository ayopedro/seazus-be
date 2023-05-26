import {
  Controller,
  UseGuards,
  Post,
  Body,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ThrottlerGuard } from '@nestjs/throttler';
import { JwtGuard } from 'src/auth/guard';
import { UrlService } from './url.service';
import { CreateUrlDto } from './dtos';
import { GetUser } from 'src/auth/decorator';
import { User } from '@prisma/client';
import { CacheInterceptor } from '@nestjs/cache-manager';

@ApiTags('URL')
@UseGuards(JwtGuard)
@UseGuards(ThrottlerGuard)
@ApiBearerAuth()
@UseInterceptors(CacheInterceptor)
@Controller('url')
export class UrlController {
  constructor(private urlService: UrlService) {}

  @Post()
  createUrl(@Body() body: CreateUrlDto, @GetUser() user: User) {
    return this.urlService.createUrl(body, user);
  }
}