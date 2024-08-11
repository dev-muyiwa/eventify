import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginUserDto, RegisterUserDto } from './dto/register-user.dto';
import { success } from '../util/function';
import { ApiBody, ApiTags } from '@nestjs/swagger';
import { SkipAuthorization } from './guards/jwt.guard';

@Controller('auth')
@ApiTags('Authentication')
@SkipAuthorization()
export class AuthController {
  constructor(private readonly authService: AuthService) {
  }

  @Post('register')
  async registerUser(@Body() createAuthDto: RegisterUserDto) {
    await this.authService.create(createAuthDto);
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
