import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  Request,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import {
  ChangePasswordDto,
  CreateUserDto,
  RefreshTokenDto,
  SigninUserDto,
} from './dtos';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { GoogleGuard, JwtGuard } from './guard';
import { GetUser } from './decorator';
import { User } from '@prisma/client';
import { CacheInterceptor } from '@nestjs/cache-manager';
import { ConfirmEmailDto } from './dtos/confirm-email.dto';

@ApiTags('Authentication')
@UseInterceptors(CacheInterceptor)
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  register(@Body() body: CreateUserDto) {
    return this.authService.createUser(body);
  }

  @Post('verify-email')
  confirm(@Body() token: ConfirmEmailDto) {
    return this.authService.confirmEmail('', token);
  }

  @HttpCode(HttpStatus.OK)
  @Post('login')
  login(@Body() body: SigninUserDto) {
    return this.authService.signinUser(body);
  }

  @HttpCode(HttpStatus.OK)
  @Patch('change-password')
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  changePassword(@Body() body: ChangePasswordDto, @GetUser() user: User) {
    return this.authService.changePassword(body, user);
  }

  @Get('social-auth')
  @UseGuards(GoogleGuard)
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  googleAuth() {}

  @Get('google-redirect')
  @UseGuards(GoogleGuard)
  googleAuthRedirect(@Request() req: any) {
    return this.authService.googleLogin(req);
  }

  @Post('refresh-token')
  refresh(@Body() body: RefreshTokenDto) {
    return this.authService.refreshTokens(body);
  }
}
