import { Inject, Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Knex } from 'knex';
import { User } from './entities/user.entity';

@Injectable()
export class UserService {
  private readonly user;
  constructor(@Inject('KnexConnection') private readonly knex: Knex) {
    this.user = knex<User>('active_users');
  }
  async findOneByEmail(email: string): Promise<User | undefined> {
    return this.user.where('email', email).first();
  }
  create(createUserDto: CreateUserDto) {
    return 'This action adds a new user';
  }

  findAll() {
    return `This action returns all user`;
  }

  findOne(id: number) {
    return `This action returns a #${id} user`;
  }

  update(id: number, updateUserDto: UpdateUserDto) {
    return `This action updates a #${id} user`;
  }

  remove(id: number) {
    return `This action removes a #${id} user`;
  }
}
