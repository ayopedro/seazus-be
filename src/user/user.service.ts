import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async getAllUrls(id: string) {
    const urls = await this.prisma.url.findMany({
      where: { userId: id },
      include: { clickData: true, QrCode: true },
    });

    const modifiedUrls = urls.map((url) => {
      const qrCode = url.QrCode;

      if (!qrCode || !qrCode.image) return url;

      const imageBuffer = Buffer.from(qrCode.image);
      const imageUrl = `data:image/png;base64,${imageBuffer.toString(
        'base64',
      )}`;

      return { ...url, QrCode: { ...qrCode, image: imageUrl } };
    });

    return modifiedUrls;
  }
}
