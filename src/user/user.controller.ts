import { Controller, Get, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ThrottlerGuard } from '@nestjs/throttler';
import { User } from '@prisma/client';
import { GetUser } from 'src/auth/decorator';
import { JwtGuard } from 'src/auth/guard';
import { UserService } from './user.service';
import { CacheInterceptor } from '@nestjs/cache-manager';

@ApiTags('User')
@UseGuards(JwtGuard)
@UseGuards(ThrottlerGuard)
@ApiBearerAuth()
@UseInterceptors(CacheInterceptor)
@Controller('user')
export class UserController {
  constructor(private userService: UserService) {}
  @Get()
  getUser(@GetUser() user: User) {
    return user;
  }

  @Get('urls')
  getUserUrls(@GetUser() { id }: User) {
    return this.userService.getAllUrls(id);
  }
}
