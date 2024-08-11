import { RegisterUserDto } from '../../auth/dto/register-user.dto';
import { IsOptional, IsString } from 'class-validator';
import { PartialType, OmitType } from '@nestjs/swagger';

export class UpdateUserDto extends PartialType(
  OmitType(RegisterUserDto, ['password', 'email']),
) {
  @IsOptional()
  @IsString()
  readonly bio: string;

  @IsOptional()
  @IsString()
  readonly location: string;
}
