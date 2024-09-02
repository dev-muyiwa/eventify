import { IsNumber, IsString } from 'class-validator';
import { PartialType } from '@nestjs/swagger';

export class CreateTicketDto {
  @IsString({ message: 'Ticket name must be a string' })
  readonly name: string;

  @IsString({ message: 'Ticket description must be a string' })
  readonly description: string;

  @IsNumber({}, { message: 'Ticket price must be a number' })
  readonly price: number;

  @IsNumber({}, { message: 'Ticket quantity must be a number' })
  readonly available_quantity: number;
}

export class UpdateTicketDto extends PartialType(CreateTicketDto) {}
