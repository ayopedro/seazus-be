import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt';
import { GoogleStrategy, JwtStrategy } from './strategies';
import { RefreshTokenService } from 'src/auth/refresh-token.service';

@Module({
  imports: [JwtModule.register({})],
  providers: [AuthService, JwtStrategy, GoogleStrategy, RefreshTokenService],
  controllers: [AuthController],
})
export class AuthModule {}
