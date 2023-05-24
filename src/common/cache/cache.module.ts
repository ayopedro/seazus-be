import { Module } from '@nestjs/common';
import { CacheModule as NestCacheModule } from '@nestjs/cache-manager';
import { CacheService } from './cache.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as redisStore from 'cache-manager-redis-store';
import type { RedisClientOptions } from 'redis';
import { Store } from 'cache-manager';

@Module({
  providers: [CacheService],
  exports: [CacheService],
  imports: [
    NestCacheModule.registerAsync<RedisClientOptions>({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        store: redisStore as unknown as Store,
        url: configService.get<string>('REDIS_URL'),
      }),
      inject: [ConfigService],
    }),
  ],
})
export class CacheModule {}
