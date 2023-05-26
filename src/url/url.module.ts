import { Module } from '@nestjs/common';
import { UrlController } from './url.controller';
import { UrlService } from './url.service';
import { JwtModule } from '@nestjs/jwt';
import { PrismaService } from 'src/prisma/prisma.service';
import { CacheService } from 'src/common/cache/cache.service';
import { CacheModule } from '@nestjs/cache-manager';

@Module({
  imports: [JwtModule.register({}), CacheModule.register({})],
  controllers: [UrlController],
  providers: [UrlService, PrismaService, CacheService],
})
export class UrlModule {}
