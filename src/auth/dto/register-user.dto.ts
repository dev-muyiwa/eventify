import {
  IsDateString,
  IsEmail,
  IsNotEmpty,
  IsString,
  IsStrongPassword,
  registerDecorator,
  ValidationOptions,
} from 'class-validator';
import { PickType } from '@nestjs/mapped-types';

export class RegisterUserDto {
  @IsString({ message: 'First name must be a string' })
  @IsNotEmpty({ message: 'First name is required' })
  readonly firstName: string;

  @IsString({ message: 'First name must be a string' })
  @IsNotEmpty({ message: 'First name is required' })
  readonly lastName: string;

  @IsDateString({ strict: true }, { message: 'Invalid date of birth format' })
  @IsAdult({
    message: 'Date of birth must indicate an age of at least 18 years',
  })
  readonly dateOfBirth: Date;

  @IsEmail({}, { message: 'Invalid email format' })
  readonly email: string;

  @IsStrongPassword({}, { message: 'Password is too weak' })
  readonly password: string;
}

export class LoginUserDto extends PickType(RegisterUserDto, [
  'email',
  'password',
] as const) {}

function IsAdult(validationOptions?: ValidationOptions) {
  return function (object: NonNullable<unknown>, propertyName: string) {
    registerDecorator({
      name: 'isAdult',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any) {
          if (typeof value !== 'string' && !(value instanceof Date)) {
            return false;
          }

          const today = new Date();
          const birthDate = new Date(value);
          let age = today.getFullYear() - birthDate.getFullYear();
          const monthDifference = today.getMonth() - birthDate.getMonth();

          if (
            monthDifference < 0 ||
            (monthDifference === 0 && today.getDate() < birthDate.getDate())
          ) {
            age--;
          }

          return age >= 18;
        },
        defaultMessage() {
          return `Date of birth must indicate an age of at least 18 years`;
        },
      },
    });
  };
}
