import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto, SigninUserDto } from './dtos';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  register(@Body() body: CreateUserDto) {
    return this.authService.createUser(body);
  }

  @HttpCode(HttpStatus.OK)
  @Post('login')
  login(@Body() body: SigninUserDto) {
    return this.authService.signinUser(body);
  }
}
