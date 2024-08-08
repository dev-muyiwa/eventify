import {IsNotEmpty, IsStrongPassword,} from 'class-validator';
import {Matches} from "class-validator/types/decorator/string/Matches";

export class UpdatePasswordDto {
    @IsNotEmpty()
    readonly old_password: string;

    @IsNotEmpty()
    @IsStrongPassword()
    readonly new_password: string;

    @IsNotEmpty()
    @Matches('new_password')
    readonly confirm_password: string;
}
