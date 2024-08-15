import { Body, Controller, Get, HttpCode, HttpStatus, Post, Query } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginUserDto, RegisterUserDto } from './dto/register-user.dto';
import { success } from '../util/function';
import { ApiBody, ApiTags } from '@nestjs/swagger';
import { SkipAuthorization } from './guards/jwt.guard';
import { InjectQueue } from '@nestjs/bullmq';
import { BullTypes, EmailTypes } from '../config/types';
import { Queue } from 'bullmq';

@Controller('auth')
@ApiTags('Authentication')
@SkipAuthorization()
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    @InjectQueue(BullTypes.EMAIL) private emailQueue: Queue,
  ) {}

  @Post('register')
  async registerUser(@Body() createAuthDto: RegisterUserDto) {
    const { first_name, last_name, email } = await this.authService.create(createAuthDto);

    await this.emailQueue.add(EmailTypes.EMAIL_VERIFICATION, {
      first_name,
      last_name,
      email,
    });
    return success(
      null,
      'user registered successfully. check your email for verification',
    );
  }

  @ApiBody({ type: LoginUserDto })
  @HttpCode(HttpStatus.OK)
  @Post('login')
  async loginUser(@Body() loginUserDto: LoginUserDto) {
    const user = await this.authService.login(loginUserDto);
    return success(user, 'user logged in successfully');
  }

  @Get('verify-email')
  async verifyEmail(@Query('token') token: string) {
    const { first_name, email } = await this.authService.verifyEmail(token);

    await this.emailQueue.add(EmailTypes.WELCOME, { first_name, email });
    return success(null, 'email verified successfully');
  }
}
