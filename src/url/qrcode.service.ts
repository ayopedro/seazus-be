import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { QRCodeToFileOptionsPng, toBuffer } from 'qrcode';
import * as sharp from 'sharp';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class QrCodeService {
  constructor(
    private prismaService: PrismaService,
    private configService: ConfigService,
  ) {}

  async generateQrCode(urlId: string): Promise<Buffer> {
    const url = await this.prismaService.url.findFirst({
      where: { id: urlId },
    });

    if (!url) throw new NotFoundException('URL not found!');

    const qrCodeOptions: QRCodeToFileOptionsPng = {
      errorCorrectionLevel: 'H',
      type: 'png',
      width: 300,
      margin: 1,
    };

    const qrcodeBuffer = await toBuffer(
      `${this.configService.get('BASE_URL')}/${url.shortUrl}`,
      qrCodeOptions,
    );

    const processedImage = await sharp(qrcodeBuffer)
      .resize(200, 200)
      .png()
      .toBuffer();

    await this.prismaService.qrCode.create({
      data: {
        url: { connect: { id: urlId } },
        image: processedImage,
      },
    });

    return processedImage;
  }

  async getQrCode(id: string) {
    const qrCode = await this.prismaService.qrCode.findFirst({
      where: { urlId: id },
    });

    if (!qrCode) throw new NotFoundException(' QR Code not found');

    return qrCode.image;
  }

  async deleteQrCode(id: string) {
    const qrCode = await this.prismaService.qrCode.findFirst({
      where: { urlId: id },
    });

    if (!qrCode)
      throw new ForbiddenException('Operation Failed. URL does not exist');

    return this.prismaService.qrCode.delete({ where: { urlId: id } });
  }
}
