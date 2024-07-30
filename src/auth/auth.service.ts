import { Inject, Injectable } from '@nestjs/common';
import { RegisterUserDto } from './dto/register-user.dto';
import { UpdateAuthDto } from './dto/update-auth.dto';
import { ConfigService } from '@nestjs/config';
import { Knex } from 'knex';

@Injectable()
export class AuthService {
  constructor(
    private configService: ConfigService,
    @Inject('KnexConnection') private readonly knex: Knex,
  ) {}
  create(createAuthDto: RegisterUserDto) {
    return 'This action adds a new auth';
  }

  findAll() {
    return `This action returns all auth`;
  }

  findOne(id: number) {
    return `This action returns a #${id} auth`;
  }

  update(id: number, updateAuthDto: UpdateAuthDto) {
    return `This action updates a #${id} auth`;
  }

  remove(id: number) {
    return `This action removes a #${id} auth`;
  }
}
