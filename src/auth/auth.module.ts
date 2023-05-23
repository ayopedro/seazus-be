import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './strategy';
import { RefreshTokenService } from 'src/refresh-token/refresh-token.service';

@Module({
  imports: [JwtModule.register({})],
  providers: [AuthService, JwtStrategy, RefreshTokenService],
  controllers: [AuthController],
})
export class AuthModule {}
