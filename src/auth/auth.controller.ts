import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import {
  ChangePasswordDto,
  CreateUserDto,
  ForgotPasswordDto,
  RefreshTokenDto,
  ResetDto,
  SigninUserDto,
} from './dtos';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { GoogleGuard, JwtGuard } from './guard';
import { ApiResponseMetadata, GetUser } from './decorator';
import { User } from '@prisma/client';
import { CacheInterceptor } from '@nestjs/cache-manager';
import { ConfirmEmailDto } from './dtos/confirm-email.dto';
import { TokenType } from 'src/common/token/enums';

@ApiTags('Authentication')
@UseInterceptors(CacheInterceptor)
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  register(@Body() body: CreateUserDto) {
    return this.authService.createUser(body);
  }

  @HttpCode(HttpStatus.OK)
  @Post('verify-email/:id')
  confirm(@Body() token: ConfirmEmailDto, @Param('id') id: string) {
    return this.authService.confirmEmail(id, token);
  }

  @HttpCode(HttpStatus.OK)
  @ApiResponseMetadata({ message: 'OTP sent successfully!!!' })
  @Post('new-otp/:id')
  resendToken(@Param('id') id: string) {
    return this.authService.newToken(id, TokenType.EMAIL_VERIFICATION);
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

  @Post('forgot-password')
  forgotPassword(@Body() body: ForgotPasswordDto) {
    return this.authService.forgotPassword(body.email);
  }

  @Patch('reset-password')
  resetPassword(
    @Query('userId') userId: string,
    @Body() { token, newPassword }: ResetDto,
  ) {
    return this.authService.resetPassword(userId, token, newPassword);
  }

  @Get('social-auth')
  @UseGuards(GoogleGuard)
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  async googleAuth() {}

  @Get('google-redirect')
  @UseGuards(GoogleGuard)
  googleAuthRedirect(@Request() req: any) {
    return this.authService.googleLogin(req);
  }

  @Post('google-auth')
  // @UseGuards(GoogleGuard)
  googleSignupOrLogin(@Body() { access_token }: { access_token: string }) {
    return this.authService.googleClientAuth(access_token);
  }

  @Post('refresh-token')
  refresh(@Body() body: RefreshTokenDto) {
    return this.authService.refreshTokens(body);
  }

  @Post('logout')
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  logoutUser(@GetUser() { id }: User) {
    return this.authService.logoutUser(id);
  }
}
