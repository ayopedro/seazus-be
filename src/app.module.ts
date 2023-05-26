import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';
import { UserModule } from './user/user.module';
import { ThrottlerModule } from '@nestjs/throttler';
import { CacheModule } from './common/cache/cache.module';
import { UrlModule } from './url/url.module';
import { PrismaService } from './prisma/prisma.service';
import { UrlService } from './url/url.service';

@Module({
  imports: [
    AuthModule,
    CacheModule,
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    UserModule,
    ThrottlerModule.forRoot({
      ttl: 60,
      limit: 10,
    }),
    UrlModule,
  ],
  controllers: [AppController],
  providers: [PrismaService, UrlService],
})
export class AppModule {}
