import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { KNEX_CONNECTION } from '../database/knexfile';
import { Knex } from 'knex';
import { Event } from './entities/event.entity';
import { paginate } from '../util/function';

@Injectable()
export class EventsService {
  constructor(@Inject(KNEX_CONNECTION) private readonly knex: Knex) {}
  async createEvent(createEventDto: CreateEventDto, creatorId: string) {
    const { name, description, startDate, endDate, location } = createEventDto;
    const existingEvent = await this.knex<Event>('events')
      .where('name', name)
      .andWhere('creator_id', creatorId)
      .first();

    if (existingEvent) {
      throw new BadRequestException('An event with this name already exists');
    }
    const [newEvent] = await this.knex<Event>('events')
      .insert({
        name: name,
        description: description,
        starts_at: startDate,
        ends_at: endDate,
        location: location,
        creator_id: creatorId,
      } as Event)
      .returning('*');

    return newEvent;
  }

  async findAllEvents() {
    //todo( add sorting and filtering)
    return await paginate<Event>(this.knex, 'events', 1);
  }

  async findAllActiveEvents() {
    return await paginate<Event>(
      this.knex,
      'active_events',
      1,
      'created_at',
      'desc',
    );
  }

  async findOne(id: string) {
    const event = await this.knex<Event>('events').where('id', id).first();
    if (!event) {
      throw new BadRequestException('event not found');
    }
    return event;
  }

  async updateEvent(id: string, updateEventDto: UpdateEventDto) {
    return `This action updates a #${id} event`;
  }

  async publishEvent(id: string, creatorId: string) {
    let event = await this.knex<Event>('events')
      .where({ id: id, creator_id: creatorId })
      .first();
    if (!event) {
      throw new BadRequestException('event not found');
    }

    if (event.published_at) {
      throw new BadRequestException('event already published');
    }

    event = await this.knex<Event>('events')
      .where('id', id)
      .update({ published_at: new Date() })
      .select('*');

    return event;
  }

  async deleteEvent(id: string, creatorId: string) {
    const event = await this.knex<Event>('events')
      .where({ id: id, creator_id: creatorId })
      .delete();
    if (event === 0) {
      throw new BadRequestException('event not found');
    }
  }
}
