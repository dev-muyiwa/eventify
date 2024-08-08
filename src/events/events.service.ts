import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { KNEX_CONNECTION } from '../database/knexfile';
import { Knex } from 'knex';
import { Event } from './entities/event.entity';
import { paginate } from '../util/function';

@Injectable()
export class EventsService {
  private eventsQuery: Knex.QueryBuilder<Event>;
  private activeEventsQuery: Knex.QueryBuilder<Event>;

  constructor(@Inject(KNEX_CONNECTION) private readonly knex: Knex) {
    this.eventsQuery = this.knex<Event>('events');
    this.activeEventsQuery = this.knex<Event>('active_events');
  }

  async createEvent( creatorId: string, createEventDto: CreateEventDto) {
    const { name, description, startDate, endDate, location } = createEventDto;
    const existingEvent = await this.activeEventsQuery
      .where('name', name)
      .andWhere('creator_id', creatorId)
      .first();

    if (existingEvent) {
      throw new BadRequestException('an event with this name already exists');
    }
    const [newEvent] = await this.eventsQuery
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
    const event = await this.eventsQuery.where('id', id).first();
    if (!event) {
      throw new EventNotFoundException();
    }
    return event;
  }

  async updateEvent(eventId: string, updateEventDto: UpdateEventDto) {
    const { name, description, startDate, endDate, location } = updateEventDto;
    const event = await this.eventsQuery.where('id', eventId).first();
    if (!event) {
      throw new EventNotFoundException();
    }

    if (event.published_at) {
      throw new BadRequestException('event already published');
    }

    const [updatedEvent] = await this.eventsQuery
      .where('id', eventId)
      .update({
        name: name || event.name,
        description: description || event.description,
        starts_at: startDate || event.starts_at,
        ends_at: endDate || event.ends_at,
        location: location || event.location,
      } as Event)
      .returning('*');

    return updatedEvent;
  }

  async publishEvent(eventId: string, creatorId: string) {
    const event = await this.eventsQuery
      .where({ id: eventId, creator_id: creatorId })
      .first();
    if (!event) {
      throw new EventNotFoundException();
    }

    if (event.published_at) {
      throw new BadRequestException('event already published');
    }

    const [publishedEvent] = await this.eventsQuery
      .where('id', eventId)
      .update({ published_at: new Date() })
      .returning('*');

    return publishedEvent;
  }

  async deleteEvent(eventId: string, creatorId: string) {
    const event = await this.eventsQuery
      .where({ id: eventId, creator_id: creatorId })
      .delete();
    if (event === 0) {
      throw new EventNotFoundException();
    }
  }
}

export class EventNotFoundException extends NotFoundException {
  constructor() {
    super('event not found');
  }
}
