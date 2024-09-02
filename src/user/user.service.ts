import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { UpdateUserDto } from './dto/update-user.dto';
import { Knex } from 'knex';
import { User, UserRole } from './entities/user.entity';
import { KNEX_CONNECTION } from '../database/knexfile';
import { HttpException } from '@nestjs/common/exceptions';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { FilterDto } from './dto/filter.dto';
import bcrypt from 'bcryptjs';
import { RegisterUserDto } from '../auth/dto/register-user.dto';
import { TableName } from '../database/tables';
import { Cart } from '../cart/entities/cart.entity';

@Injectable()
export class UserService {
  constructor(@Inject(KNEX_CONNECTION) private readonly knex: Knex) {}

  async create(createAuthDto: RegisterUserDto): Promise<User> {
    const { firstName, lastName, dateOfBirth, password, email } = createAuthDto;
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    return await this.knex.transaction(async (trx) => {
      const [newUser] = await trx<User>(TableName.USERS)
        .insert({
          first_name: firstName,
          last_name: lastName,
          dob: dateOfBirth,
          email: email,
          password: passwordHash,
        })
        .returning('*');

      await trx<Cart>(TableName.CARTS).clone().insert({
        user_id: newUser.id,
      });

      return newUser;
    });
  }

  async findOneByEmail(email: string): Promise<User | null> {
    const [user] = await this.knex<User>(TableName.ACTIVE_USERS)
      .where('email', email)
      .returning('*');
    return user;
  }

  async findAll(filters: FilterDto) {
    return `This action returns all user`;
  }

  async findOne(userId: string) {
    const [user] = await this.knex<User>(TableName.USERS)
      .where('id', userId)
      .returning('*');
    if (!user) {
      throw new UserNotFoundException();
    }
    return user;
  }

  async updateUserProfile(userId: string, updateUserDto: UpdateUserDto) {
    const [user] = await this.knex<User>(TableName.ACTIVE_USERS).where(
      'id',
      userId,
    );
    if (!user) {
      throw new UserNotFoundException();
    }
    const [updatedUser] = await this.knex<User>(TableName.USERS)
      .where('id', userId)
      .update({
        first_name: updateUserDto.firstName || user.first_name,
        last_name: updateUserDto.lastName || user.last_name,
        bio: updateUserDto.bio || user.bio,
        location: updateUserDto.location || user.location,
        dob: updateUserDto.dateOfBirth || user.dob,
      } as User)
      .returning('*');
    const { password, ...data } = updatedUser;
    return data;
  }

  async verifyUser(email: string) {
    const [user] = await this.knex<User>(TableName.USERS)
      .where('email', email)
      .update('verified_at', new Date())
      .returning(['email', 'first_name']);
    if (!user) {
      throw new UserNotFoundException();
    }
    return user;
  }

  async updateUserPassword(
    userId: string,
    updatePasswordDto: UpdatePasswordDto,
  ) {
    const [user] = await this.knex<User>(TableName.ACTIVE_USERS).where(
      'id',
      userId,
    );
    if (!user) {
      throw new UserNotFoundException();
    }
    const isPasswordMatch = await bcrypt.compare(
      updatePasswordDto.old_password,
      user.password,
    );
    if (!isPasswordMatch) {
      throw new BadRequestException('incorrect password');
    }
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(
      updatePasswordDto.new_password,
      salt,
    );

    await this.knex<User>(TableName.USERS)
      .where('id', user.id)
      .update({ password: passwordHash });

    return { id: user.id };
  }

  async deactivateAccount(userId: string) {
    return `This action deactivates a #${userId} user`;
  }

  async becomeAnOrganizer(userId: string) {
    const updatedUser = await this.knex<User>(TableName.USERS)
      .where('id', userId)
      // .whereNotIn('roles', [UserRole.ADMIN.toString()])
      // .orWhereNotIn('roles', [UserRole.ORGANIZER.toString()])
      .update({
        roles: this.knex.raw('array_append(roles, ?)', [UserRole.ORGANIZER]),
      });

    if (updatedUser === 0) {
      throw new ExistingRoleException();
    }
  }

  async becomeAnAdministrator(userId: string) {
    const updatedUser = await this.knex<User>(TableName.USERS)
      .where('id', userId)
      // .whereNotIn('roles', [UserRole.ADMIN, UserRole.ORGANIZER])
      .update({
        roles: this.knex.raw('array_append(roles, ?)', [UserRole.ADMIN]),
      });
    if (updatedUser === 0) {
      throw new ExistingRoleException();
    }
  }
}

export class ExistingRoleException extends HttpException {
  constructor() {
    super('user is already an organizer or an administrator', 400);
  }
}

export class UserNotFoundException extends HttpException {
  constructor() {
    super('user not found', 404);
  }
}
