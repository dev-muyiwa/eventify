import {CreateUserDto} from './create-user.dto';
import {OmitType} from "@nestjs/mapped-types/dist";

export class UpdateUserDto extends OmitType(CreateUserDto, ['password', 'email']) {
}