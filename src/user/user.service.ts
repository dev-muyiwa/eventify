import { Inject, Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Knex } from 'knex';
import { User } from './entities/user.entity';
import { KNEX_CONNECTION } from '../database/knexfile';

@Injectable()
export class UserService {
  private readonly activeUserQuery;
  constructor(@Inject(KNEX_CONNECTION) private readonly knex: Knex) {
    this.activeUserQuery = knex<User>('active_users');
  }
  async findOneByEmail(email: string): Promise<User | undefined> {
    const [user] = await this.activeUserQuery
      .where('email', email)
      .returning('*');
    return user;
  }
  create(createUserDto: CreateUserDto) {
    return 'This action adds a new activeUserQuery';
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
