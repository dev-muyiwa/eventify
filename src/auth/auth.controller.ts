import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginUserDto, RegisterUserDto } from './dto/register-user.dto';
import { success } from '../util/function';
import { ApiBody, ApiTags } from '@nestjs/swagger';
import { SkipAuthorization } from './guards/jwt.guard';
import { InjectQueue } from '@nestjs/bullmq';
import { BullTypes, EmailTypes } from '../config/types';
import { Queue } from 'bullmq';
import { EmailData } from '../util/email.processor';

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
    const user = await this.authService.create(createAuthDto);
    if (user) {
      const data: EmailData = {
        to: user.email,
        subject: 'Welcome to Eventify',
        html: `<h1>Welcome ${user.first_name}</h1>`,
      };
      await this.emailQueue.add(EmailTypes.WELCOME, data);
    }
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
}
