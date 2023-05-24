import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService, private prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKeyProvider: (
        request: any,
        rawJwtToken: string,
        done: (arg0: any, arg1: any) => void,
      ) => {
        console.log(
          '🚀 ~ file: jwt.strategy.ts:18 ~ JwtStrategy ~ constructor ~ rawJwtToken:',
          rawJwtToken,
        );
        const isAccessToken = !rawJwtToken.includes('refresh_token');

        const jwtSecret = config.get(
          isAccessToken ? 'JWT_SECRET' : 'JWT_REFRESH_SECRET',
        );

        done(null, jwtSecret);
      },
    });
  }

  async validate(payload: { sub: string; email: string }) {
    const user = await this.prisma.user.findUnique({
      where: {
        id: payload.sub,
      },
    });

    delete user.password;
    return user;
  }
}
