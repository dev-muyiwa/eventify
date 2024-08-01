import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { RegisterUserDto } from './dto/register-user.dto';
import { UpdateAuthDto } from './dto/update-auth.dto';
import { Knex } from 'knex';
import { User } from '../user/entities/user.entity';
import bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
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

  async login(user: any) {
    const payload = { email: user.email, sub: user.id };
    delete user.created_at;
    delete user.updated_at;
    delete user.deleted_at;
    delete user.password;
    return {
      ...user,
      access_token: this.jwtService.sign(payload),
    };
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
