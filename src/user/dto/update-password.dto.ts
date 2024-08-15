import {
  IsNotEmpty,
  IsStrongPassword,
  Validate,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { faker } from '@faker-js/faker';

@ValidatorConstraint({ name: 'matchPassword', async: false })
export class MatchPassword implements ValidatorConstraintInterface {
  validate(confirmPassword: string, args: ValidationArguments) {
    const [relatedPropertyName] = args.constraints;
    const relatedValue = (args.object as any)[relatedPropertyName];
    return confirmPassword === relatedValue;
  }

  defaultMessage(args: ValidationArguments) {
    return 'Passwords do not match';
  }
}

export class UpdatePasswordDto {
  @IsNotEmpty()
  readonly old_password: string;

  @IsNotEmpty()
  @IsStrongPassword()
  readonly new_password: string;

  @IsNotEmpty()
  @Validate(MatchPassword, ['new_password'])
  readonly confirm_password: string;

  static generateTestObject(isRandom: boolean = false) {
    const body = {
      old_password: isRandom ? faker.internet.password() : 'Password-123?',
      new_password: isRandom ? faker.internet.password() : 'Password-123478?',
    };
    return { ...body, confirm_password: body.new_password };
  }
}
