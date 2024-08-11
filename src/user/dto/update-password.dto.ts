import { IsNotEmpty, IsStrongPassword, Matches } from 'class-validator';

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
