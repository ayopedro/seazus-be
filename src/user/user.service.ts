import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  getAllUrls(id: string) {
    return this.prisma.url.findMany({ where: { userId: id } });
  }
}
