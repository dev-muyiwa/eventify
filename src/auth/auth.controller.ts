import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginUserDto, RegisterUserDto } from './dto/register-user.dto';
import { success } from '../util/function';
import { ApiTags } from '@nestjs/swagger';

@Controller('auth')
@ApiTags('Authentication')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async registerUser(@Body() createAuthDto: RegisterUserDto) {
    await this.authService.create(createAuthDto);
    // send a welcome + verify email to the user
    return success(
      null,
      'user registered successfully. check your email for verification',
    );
  }

  @Post('login')
  async loginUser(@Body() loginAuthDto: LoginUserDto) {
    const user = await this.authService.login(loginAuthDto);
    // generate jwt token and send it to the user
    return success(user, 'user logged in successfully');
  }
}
