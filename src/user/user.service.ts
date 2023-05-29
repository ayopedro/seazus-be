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

    return urls;
  }
}
