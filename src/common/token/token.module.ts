import { Module } from '@nestjs/common';
import { TokenService } from './token.service';
import { CacheService } from '../cache/cache.service';

@Module({
  providers: [TokenService, CacheService],
})
export class TokenModule {}
