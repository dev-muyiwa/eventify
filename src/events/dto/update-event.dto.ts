import { PartialType } from '@nestjs/swagger';
import { CreateEventDto } from './create-event.dto';
import { IsUUID } from 'class-validator';

export class UpdateEventDto extends PartialType(CreateEventDto) {}

export class IdParam {
  @IsUUID()
  id: string;
}
