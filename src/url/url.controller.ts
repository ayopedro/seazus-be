import {
  Controller,
  UseGuards,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  Query,
  Get,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ThrottlerGuard } from '@nestjs/throttler';
import { JwtGuard } from 'src/auth/guard';
import { UrlService } from './url.service';
import { CreateUrlDto, EditUrlDto } from './dtos';
import { ApiResponseMetadata, GetUser } from 'src/auth/decorator';
import { User } from '@prisma/client';
import { QrCodeService } from './qrcode.service';

@ApiTags('URL')
@UseGuards(JwtGuard)
@UseGuards(ThrottlerGuard)
@ApiBearerAuth()
@Controller('url')
export class UrlController {
  constructor(
    private urlService: UrlService,
    private qrcodeService: QrCodeService,
  ) {}

  @Get(':id')
  getUrl(@Param('id') id: string) {
    return this.urlService.getUrl(id);
  }

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

  @ApiResponseMetadata({ message: 'URL is updated successfully!!!' })
  @Patch(':id')
  editUrl(@Param('id') id: string, @Body() body: EditUrlDto) {
    return this.urlService.editUrl(id, body);
  }

  @ApiResponseMetadata({ message: 'URL is deleted successfully!!!' })
  @Delete(':id')
  deleteUrl(@Param('id') id: string) {
    return this.urlService.deleteUrl(id);
  }

  @ApiResponseMetadata({ message: 'QR Code is deleted successfully!!!' })
  @Delete(':id/qrcode')
  deleteQrcode(@Param('id') id: string) {
    return this.qrcodeService.deleteQrCode(id);
  }
}
