import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { LoginUserDto, RegisterUserDto } from './dto/register-user.dto';
import { Knex } from 'knex';
import { User } from '../user/entities/user.entity';
import bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { KNEX_CONNECTION } from '../database/knexfile';
import { UserNotFoundException, UserService } from '../user/user.service';

@Injectable()
export class AuthService {
  private usersQuery: Knex.QueryBuilder<User>;

  constructor(
    private jwtService: JwtService,
    private userService: UserService,
    @Inject(KNEX_CONNECTION) private readonly knex: Knex,
  ) {
    this.usersQuery = this.knex<User>('users');
  }

  async create(createAuthDto: RegisterUserDto): Promise<User> {
    const { firstName, lastName, dateOfBirth, password, email } = createAuthDto;
    const existingUser = await this.userService.findOneByEmail(email);
    if (existingUser) {
      throw new BadRequestException(
        'an account with this email already exists',
      );
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const [newUser] = await this.usersQuery
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

  async login(loginDto: LoginUserDto) {
    const { email, password } = loginDto;
    const user = await this.userService.findOneByEmail(email);
    if (!user) {
      throw new NotFoundException('incorrect login credentials');
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new NotFoundException('incorrect login credentials');
    }

    return {
      access_token: this.jwtService.sign(
        { email: email },
        {
          subject: user.id,
        },
      ),
    };
  }

  async verifyEmail(token: string) {
    const decodedToken = Buffer.from(token, 'base64').toString('ascii');
    const { email, type } = this.jwtService.verify(decodedToken) as {
      email: string;
      type: string;
    };
    if (type !== 'verification') {
      throw new BadRequestException('invalid token');
    }
    const user = await this.userService.findOneByEmail(email);
    if (!user) {
      throw new UserNotFoundException();
    }
    const [updatedUser] = await this.usersQuery
      .where('email', email)
      .update('verified_at', new Date())
      .returning(['email', 'first_name']);

    return updatedUser;
  }
}
