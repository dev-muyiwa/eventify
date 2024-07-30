import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterUserDto } from './dto/register-user.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async registerUser(@Body() createAuthDto: RegisterUserDto) {
    const newUser = await this.authService.create(createAuthDto);
    //   send registration email
    return newUser;
  }
}
