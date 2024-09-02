import { IsNumber, IsUUID } from 'class-validator';

export class CreateCartItemDto {
  @IsUUID(undefined, { message: 'ticket_id must be a valid UUID' })
  ticket_id: string;

  @IsNumber({}, { message: 'quantity must be a number' })
  quantity: number;
}
