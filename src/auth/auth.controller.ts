import { Body, Controller, Inject, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateAuthDto } from './dto/create-auth.dto';
import { ConfigService } from '@nestjs/config';
import { knex, Knex } from 'knex';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private configService: ConfigService,
    @Inject('KnexConnection') private readonly knex: Knex,
  ) {}

  @Post('register')
  async registerUser(@Body() createAuthDto: CreateAuthDto) {
    //   find a user by the email or phone
    const existingUser = await knex('users').first({ name: 'moyo' });
  }
}
