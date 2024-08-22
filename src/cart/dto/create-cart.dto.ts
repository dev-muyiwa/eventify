import { IsEmail, IsString, IsUUID, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class AttendeeDto {
  @IsString({ message: 'first_name must be a string' })
  first_name: string;

  @IsString({ message: 'last_name must be a string' })
  last_name: string;

  @IsEmail({}, { message: 'email must be a string' })
  email: string;
}

export class CreateCartItemDto {
  @IsUUID(undefined, { message: 'ticket_id must be a valid UUID' })
  ticket_id: string;

  @ValidateNested()
  @Type(() => AttendeeDto)
  attendee: AttendeeDto;
}
