import { BadRequestException, Injectable } from '@nestjs/common';
import { CacheService } from '../cache/cache.service';

@Injectable()
export class TokenService {
  constructor(private cacheService: CacheService) {}

  async createToken(type: string, email: string, ttl?: number) {
    const token = Math.floor(Math.random() * 900000) + 1000;

    const userData = {
      id: email,
      type,
      token,
    };

    await this.cacheService.set(type, JSON.stringify(userData), ttl);
    return token;
  }

  async verifyToken(key: string, userToken: string, email: string) {
    const existingToken = await this.cacheService.get(key);
    if (!existingToken) throw new BadRequestException('Invalid token');

    const { id, type, token } = JSON.parse(existingToken);

    if (id === email && type === key && token === parseInt(userToken)) {
      await this.cacheService.remove(key);
      return true;
    }
    throw new BadRequestException('Invalid token');
  }
}
