import { RegisterUserDto } from '../../auth/dto/register-user.dto';
import { IsOptional, IsString } from 'class-validator';
import { PartialType, OmitType } from '@nestjs/swagger';
import { faker } from '@faker-js/faker';

export class UpdateUserDto extends PartialType(
  OmitType(RegisterUserDto, ['password', 'email']),
) {
  @IsOptional()
  @IsString()
  readonly bio: string;

  @IsOptional()
  @IsString()
  readonly location: string;

  static generateTestObject(): UpdateUserDto {
    return {
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      dateOfBirth: new Date('1998-05-10'),
      bio: faker.lorem.sentence(),
      location: faker.location.streetAddress(),
    };
  }
}
