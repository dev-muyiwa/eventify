import {Body, Controller, Delete, Get, Param, Patch, Post, Req,} from '@nestjs/common';
import {UserService} from './user.service';
import {CreateUserDto} from './dto/create-user.dto';
import {UpdateUserDto} from './dto/update-user.dto';
import {User, UserRole} from "./entities/user.entity";
import {Request} from "express";
import {success} from '../util/function';
import { UpdatePasswordDto } from './dto/update-password.dto';

@Controller('users')
export class UserController {
    constructor(private readonly userService: UserService) {
    }

    @Post()
    create(@Body() createUserDto: CreateUserDto) {
        return this.userService.create(createUserDto);
    }

    @Get()
    findAll() {
        return this.userService.findAll();
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

    @Patch('me/administrator')
    async becomeAnAdministrator(@Req() req: Request) {
        const user = req.user as User;
        const isAdmin = user.roles.includes(UserRole.ADMIN);
        if (!isAdmin) {
            await this.userService.becomeAnAdministrator(user.id);
        }
        return success(null, 'user is now an administrator');
    }


    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.userService.findOne(+id);
    }

    @Patch('me/profile')
    async updateProfile(@Req() req: Request, @Body() updateUserDto: UpdateUserDto) {
        const user = req.user as User;
        const updatedUser = await this.userService.updateUserProfile(user.id, updateUserDto);
        return success(updatedUser, 'user profile updated');
    }

    @Patch('me/password')
    async updatePassword(@Req() req: Request, @Body() updatePasswordDto: UpdatePasswordDto) {
        const user = req.user as User;
        await this.userService.updateUserPassword(user.id, updatePasswordDto);
        return success(null, 'user password updated');
    }

    @Delete('me/deactivate')
    async deactivateAccount(@Req() req: Request,) {
        const user = req.user as User;
        // send an email to the user to confirm the deactivation
        await this.userService.deactivateAccount(user.id);
        return success(null, 'user account deactivated');
    }
}
