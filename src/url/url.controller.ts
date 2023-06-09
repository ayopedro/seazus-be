import {
  Controller,
  UseGuards,
  Post,
  Body,
  UseInterceptors,
  Param,
  Patch,
  Delete,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ThrottlerGuard } from '@nestjs/throttler';
import { JwtGuard } from 'src/auth/guard';
import { UrlService } from './url.service';
import { CreateUrlDto, EditUrlDto } from './dtos';
import { GetUser } from 'src/auth/decorator';
import { User } from '@prisma/client';
import { CacheInterceptor } from '@nestjs/cache-manager';
import { QrCodeService } from './qrcode.service';

@ApiTags('URL')
@UseGuards(JwtGuard)
@UseGuards(ThrottlerGuard)
@ApiBearerAuth()
@UseInterceptors(CacheInterceptor)
@Controller('url')
export class UrlController {
  constructor(
    private urlService: UrlService,
    private qrcodeService: QrCodeService,
  ) {}

  @Post()
  createUrl(@Body() body: CreateUrlDto, @GetUser() user: User) {
    return this.urlService.createUrl(body, user);
  }

  @Post(':id/qrcode')
  createQrCode(@Param('id') id: string) {
    return this.qrcodeService.generateQrCode(id);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Query('status') status: 'true' | 'false',
  ) {
    return this.urlService.updateUrlStatus(id, status);
  }

  @Patch(':id')
  editUrl(@Param('id') id: string, @Body() body: EditUrlDto) {
    return this.urlService.editUrl(id, body);
  }

  @Delete(':id')
  deleteUrl(@Param('id') id: string) {
    return this.urlService.deleteUrl(id);
  }

  @Delete(':id/qrcode')
  deleteQrcode(@Param('id') id: string) {
    return this.qrcodeService.deleteQrCode(id);
  }
}
