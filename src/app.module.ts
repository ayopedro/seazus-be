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
import { MailerModule } from './common/mailer/mailer.module';
import { TokenModule } from './common/token/token.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

@Module({
  imports: [
    AuthModule,
    CacheModule,
    ConfigModule.forRoot({ isGlobal: true }),
    MailerModule,
    PrismaModule,
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'public'),
      exclude: ['/api/(.*)'],
    }),
    ThrottlerModule.forRoot({
      ttl: 60,
      limit: 10,
    }),
    UrlModule,
    UserModule,
    TokenModule,
  ],
  controllers: [AppController],
  providers: [PrismaService, UrlService],
})
export class AppModule {}
