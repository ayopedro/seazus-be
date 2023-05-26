import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt';
import { GoogleStrategy, JwtStrategy } from './strategies';
import { RefreshTokenService } from 'src/auth/refresh-token.service';
import { MailerService } from 'src/common/mailer/mailer.service';
import { CacheService } from 'src/common/cache/cache.service';
import { TokenService } from 'src/common/token/token.service';

@Module({
  imports: [JwtModule.register({})],
  providers: [
    AuthService,
    CacheService,
    GoogleStrategy,
    JwtStrategy,
    MailerService,
    RefreshTokenService,
    TokenService,
  ],
  controllers: [AuthController],
})
export class AuthModule {}
