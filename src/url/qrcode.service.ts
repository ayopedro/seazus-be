import {
  BadRequestException,
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

  async generateQrCode(urlId: string) {
    const url = await this.prismaService.url.findFirst({
      where: { id: urlId },
    });

    const existingQr = await this.prismaService.qrCode.findUnique({
      where: { urlId: url.id },
    });

    if (!url) throw new NotFoundException('URL not found!');
    if (existingQr) throw new BadRequestException('QR Code already exists');

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

    const imageBuffer = Buffer.from(processedImage);
    const imageUrl = `data:image/png;base64,${imageBuffer.toString('base64')}`;

    return { message: 'QR code generated', imageUrl };
  }

  async getQrCode(id: string) {
    const qrCode = await this.prismaService.qrCode.findFirst({
      where: { urlId: id },
    });

    if (!qrCode) throw new NotFoundException(' QR Code not found');

    const imageBuffer = Buffer.from(qrCode.image);
    const imageUrl = `data:image/png;base64,${imageBuffer.toString('base64')}`;

    return imageUrl;
  }

  async deleteQrCode(id: string) {
    const qrCode = await this.prismaService.qrCode.findFirst({
      where: { urlId: id },
    });

    if (!qrCode)
      throw new ForbiddenException('Operation Failed. URL does not exist');

    await this.prismaService.qrCode.delete({ where: { urlId: id } });

    return { message: 'QR code deleted successfully' };
  }
}
