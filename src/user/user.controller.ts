import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Req,
} from '@nestjs/common';
import { UserService } from './user.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { User, UserRole } from './entities/user.entity';
import { Request } from 'express';
import { success } from '../util/function';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { Roles } from '../auth/guards/roles.guard';
import { IdParam } from '../events/dto/update-event.dto';
import { FilterDto } from './dto/filter.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiBearerAuth()
@ApiTags('Users')
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Roles(UserRole.ADMIN)
  @Get()
  async findAll(@Param() filters: FilterDto) {
    const users = await this.userService.findAll(filters);
    return success(users, 'users retrieved');
  }

  @Get('me')
  async getProfile(@Req() req: Request) {
    const user = req.user as User;
    return success(user, 'user profile retrieved');
  }

  @Patch('me')
  async updateProfile(
    @Req() req: Request,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    const user = req.user as User;
    const updatedUser = await this.userService.updateUserProfile(
      user.id,
      updateUserDto,
    );
    return success(updatedUser, 'user profile updated');
  }

  // add rate-limiting to this endpoint
  // if there is a brute force attack on this endpoint, the user account will be locked until they verify their email
  @Patch('me/password')
  async updatePassword(
    @Req() req: Request,
    @Body() updatePasswordDto: UpdatePasswordDto,
  ) {
    const user = req.user as User;
    const userId = await this.userService.updateUserPassword(
      user.id,
      updatePasswordDto,
    );
    return success(userId, 'user password updated');
  }

  @Roles(UserRole.ADMIN)
  @Get(':id')
  async findOne(@Param('id') idParam: IdParam) {
    return this.userService.findOne(idParam.id);
  }

  @Delete('me/deactivate')
  async deactivateAccount(@Req() req: Request) {
    const user = req.user as User;
    // send an email to the user to confirm the deactivation
    await this.userService.deactivateAccount(user.id);
    return success(null, 'user account deactivated');
  }

  @Patch('me/organizer')
  async becomeAnOrganizer(@Req() req: Request) {
    const user = req.user as User;
    const isOrganizer = user.roles.includes(UserRole.ORGANIZER);
    if (!isOrganizer) {
      await this.userService.becomeAnOrganizer(user.id);
    }
    return success(null, 'user is now an organizer');
  }

  // convert this endpoint to admin making other users an admin
  // only for admins
  @Patch('me/administrator')
  async becomeAnAdministrator(@Req() req: Request) {
    const user = req.user as User;
    const isAdmin = user.roles.includes(UserRole.ADMIN);
    if (!isAdmin) {
      await this.userService.becomeAnAdministrator(user.id);
    }
    return success(null, 'user is now an administrator');
  }
}
