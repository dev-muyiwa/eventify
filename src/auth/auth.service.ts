import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { LoginUserDto, RegisterUserDto } from './dto/register-user.dto';
import { UpdateAuthDto } from './dto/update-auth.dto';
import { ConfigService } from '@nestjs/config';
import { Knex } from 'knex';
import { User } from '../user/entities/user.entity';
import bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(
    private configService: ConfigService,
    @Inject('KnexConnection') private readonly knex: Knex,
  ) {}

  async create(createAuthDto: RegisterUserDto): Promise<User> {
    const { firstName, lastName, dateOfBirth, password, email } = createAuthDto;
    const existingUser = await this.knex<User>('users')
      .where('email', email)
      .first();
    if (existingUser) {
      throw new BadRequestException(
        'an account with this email already exists',
      );
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const [newUser] = await this.knex<User>('users')
      .insert({
        first_name: firstName,
        last_name: lastName,
        dob: dateOfBirth,
        email: email,
        password: passwordHash,
      })
      .returning('*');
    return newUser;
  }

  async login(loginAuthDto: LoginUserDto) {
    const { email, password } = loginAuthDto;
    const existingUser = await this.knex<User>('active_users')
      .where('email', email)
      .first();
    if (
      !existingUser ||
      !(await bcrypt.compare(password, existingUser.password))
    ) {
      throw new BadRequestException('invalid login credentials');
    }
    return existingUser;
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
