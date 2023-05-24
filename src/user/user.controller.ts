import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ThrottlerGuard } from '@nestjs/throttler';
import { User } from '@prisma/client';
import { GetUser } from 'src/auth/decorator';
import { JwtGuard } from 'src/auth/guard';

@ApiTags('User')
@UseGuards(JwtGuard)
@Controller('user')
export class UserController {
  @UseGuards(ThrottlerGuard)
  @Get()
  getUser(@GetUser() user: User) {
    return user;
  }
}
