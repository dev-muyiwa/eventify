import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { LoginUserDto, RegisterUserDto } from './dto/register-user.dto';
import { User } from '../user/entities/user.entity';
import bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { UserNotFoundException, UserService } from '../user/user.service';
import { EmailTypes } from '../config/types';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly userService: UserService,
  ) {}

  async create(createAuthDto: RegisterUserDto): Promise<User> {
    const existingUser = await this.userService.findOneByEmail(
      createAuthDto.email,
    );
    if (existingUser) {
      throw new BadRequestException(
        'an account with this email already exists',
      );
    }

    return this.userService.create(createAuthDto);
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
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      verified_at: user.verified_at,
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
    if (type !== EmailTypes.EMAIL_VERIFICATION) {
      throw new BadRequestException('invalid token');
    }
    const user = await this.userService.findOneByEmail(email);
    if (!user) {
      throw new UserNotFoundException();
    }
    const updatedUser = await this.userService.verifyUser(user.email);

    return { ...updatedUser, has_previously_verified: !!user.verified_at };
  }
}
