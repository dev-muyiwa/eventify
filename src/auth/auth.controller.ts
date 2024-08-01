import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterUserDto } from './dto/register-user.dto';
import { SkipAuthorization, success } from '../util/function';
import { ApiTags } from '@nestjs/swagger';
import { LocalAuthGuard } from './strategy/local.strategy';
import { Request } from 'express';

@Controller('auth')
@ApiTags('Authentication')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @SkipAuthorization()
  @Post('register')
  async registerUser(@Body() createAuthDto: RegisterUserDto) {
    await this.authService.create(createAuthDto);
    return success(
      null,
      'user registered successfully. check your email for verification',
    );
  }

  @SkipAuthorization()
  @UseGuards(LocalAuthGuard)
  @HttpCode(HttpStatus.OK)
  @Post('login')
  async loginUser(@Req() req: Request) {
    const user = await this.authService.login(req.user);
    return success(user, 'user logged in successfully');
  }
}
