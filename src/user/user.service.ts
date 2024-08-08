import { Inject, Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Knex } from 'knex';
import {User, UserRole} from './entities/user.entity';
import { KNEX_CONNECTION } from '../database/knexfile';
import {HttpException} from "@nestjs/common/exceptions";
import { UpdatePasswordDto } from './dto/update-password.dto';

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

  async becomeAnOrganizer(userId: string) {
    const updatedUser = await this.knex<User>('users')
        .where('id', userId)
        // .whereNotIn('roles', [UserRole.ADMIN.toString()])
        // .orWhereNotIn('roles', [UserRole.ORGANIZER.toString()])
        .update({roles: this.knex.raw('array_append(roles, ?)', [UserRole.ORGANIZER])});
    
    if (updatedUser === 0) {
      throw new ExistingRoleException();
    }
  }

  async becomeAnAdministrator(userId: string) {
    const updatedUser = await this.knex<User>('users')
        .where('id', userId)
        // .whereNotIn('roles', [UserRole.ADMIN, UserRole.ORGANIZER])
        .update({roles: this.knex.raw('array_append(roles, ?)', [UserRole.ADMIN])});
    if (updatedUser === 0) {
      throw new ExistingRoleException();
    }
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

  async updateUserProfile(userId: string, updateUserDto: UpdateUserDto) {
    return `This action updates a #${userId} user`;
  }

  async updateUserPassword(userId: string, updatePasswordDto: UpdatePasswordDto) {
    
    return `This action updates a #${userId} user password`;
  }

  async deactivateAccount(userId: string) {
    return `This action deactivates a #${userId} user`;
  }
}

export class ExistingRoleException extends HttpException {
  constructor() {
    super('User is already an organizer or an administrator', 400);
  }
}