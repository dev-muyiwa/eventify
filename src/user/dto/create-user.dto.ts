import {
  IsAlpha,
  IsEmail,
  IsNotEmpty,
  IsPhoneNumber,
  IsString,
  IsStrongPassword,
  MinLength,
} from 'class-validator';

export class CreateUserDto {
  @IsNotEmpty()
  @IsString()
  @IsAlpha()
  @MinLength(1)
  readonly first_name: string;

  @IsNotEmpty()
  @IsString()
  @IsAlpha()
  @MinLength(1)
  readonly last_name: string;

  @IsNotEmpty()
  @IsEmail()
  readonly email: string;

  @IsNotEmpty()
  @IsPhoneNumber()
  readonly phone_number: string;

  @IsNotEmpty()
  @IsStrongPassword()
  readonly password: string;
}
