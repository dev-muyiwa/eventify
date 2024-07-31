import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterUserDto } from './dto/register-user.dto';
import { success } from '../util/function';
import { ApiTags } from '@nestjs/swagger';

@Controller('auth')
@ApiTags('Authentication')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async registerUser(@Body() createAuthDto: RegisterUserDto) {
    const newUser = await this.authService.create(createAuthDto);
    return success(newUser, 'User registered successfully');
  }
}
