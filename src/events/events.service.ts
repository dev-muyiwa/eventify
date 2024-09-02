import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateEventDto } from './dto/create-event.dto';
import { TicketIdParam, UpdateEventDto } from './dto/update-event.dto';
import { KNEX_CONNECTION } from '../database/knexfile';
import { Knex } from 'knex';
import { Event, Ticket } from './entities/event.entity';
import { paginate } from '../util/function';
import { CreateTicketDto, UpdateTicketDto } from './dto/create-ticket.dto';
import { TableName } from '../database/tables';

@Injectable()
export class EventsService {
  constructor(@Inject(KNEX_CONNECTION) private readonly knex: Knex) {}

  async createEvent(creatorId: string, createEventDto: CreateEventDto) {
    const { name, description, startDate, endDate, location } = createEventDto;
    const [existingEvent] = await this.knex<Event>(TableName.ACTIVE_EVENTS)
      .where('name', name)
      .andWhere('creator_id', creatorId);

    if (existingEvent) {
      throw new BadRequestException('an event with this name already exists');
    }
    const [newEvent] = await this.knex<Event>(TableName.EVENTS)
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
    return await paginate<Event>(this.knex<Event>(TableName.EVENTS), 1);
  }

  async findAllActiveEvents() {
    return await paginate<Event>(
      this.knex<Event>(TableName.ACTIVE_EVENTS),
      1,
      'created_at',
      'desc',
    );
  }

  async findOne(id: string) {
    const [event] = await this.knex<Event>(TableName.EVENTS).where('id', id);
    if (!event) {
      throw new EventNotFoundException();
    }
    return event;
  }

  async updateEvent(eventId: string, updateEventDto: UpdateEventDto) {
    const { name, description, startDate, endDate, location } = updateEventDto;
    const [event] = await this.knex<Event>(TableName.ACTIVE_EVENTS).where(
      'id',
      eventId,
    );
    if (!event) {
      throw new EventNotFoundException();
    }

    if (event.published_at) {
      throw new BadRequestException('event already published');
    }

    const [updatedEvent] = await this.knex<Event>(TableName.EVENTS)
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
    const [event] = await this.knex<Event>(TableName.EVENTS)
      .where({
        id: eventId,
        creator_id: creatorId,
      })
      .select('id', 'published_at');
    if (!event) {
      throw new EventNotFoundException();
    }

    if (event.published_at) {
      throw new BadRequestException('event is already published');
    }

    const [ticket] = await this.knex<Ticket>(TableName.TICKETS)
      .where('event_id', event.id)
      .select('id');
    if (!ticket) {
      throw new BadRequestException('event has no tickets');
    }

    const [publishedEvent] = await this.knex<Event>(TableName.EVENTS)
      .where('id', eventId)
      .update({ published_at: new Date() })
      .returning('*');

    return publishedEvent;
  }

  async deleteEvent(eventId: string, creatorId: string) {
    const event = await this.knex<Event>(TableName.EVENTS)
      .where({ id: eventId, creator_id: creatorId, published_at: null })
      .delete();
    if (event === 0) {
      throw new EventNotFoundException();
    }
  }

  async createTicket(
    eventId: string,
    organizerId: string,
    ticketDto: CreateTicketDto,
  ) {
    const [event] = await this.knex<Event>(TableName.EVENTS).where({
      id: eventId,
      creator_id: organizerId,
    });
    if (!event) {
      throw new EventNotFoundException();
    }

    if (event.published_at) {
      throw new BadRequestException('event is already published');
    }

    const [ticket] = await this.knex<Ticket>(TableName.TICKETS)
      .insert({
        name: ticketDto.name,
        description: ticketDto.description,
        price: ticketDto.price,
        available_quantity: ticketDto.available_quantity,
        event_id: event.id,
      } as Ticket)
      .returning('*');

    return ticket;
  }

  async getTickets(eventId: string) {
    const [event] = await this.knex<Event>(TableName.EVENTS).where(
      'id',
      eventId,
    );
    if (!event) {
      throw new EventNotFoundException();
    }

    return await paginate<Ticket>(
      this.knex<Ticket>(TableName.TICKETS).where('event_id', event.id),
      1,
    );
  }

  async getTicket(idParam: TicketIdParam) {
    const [[event], [ticket]] = await Promise.all([
      this.knex<Event>(TableName.EVENTS).where('id', idParam.id),
      this.knex<Ticket>(TableName.TICKETS).where('id', idParam.ticket_id),
    ]);
    if (!event) {
      throw new EventNotFoundException();
    }
    if (!ticket) {
      throw new TicketNotFoundException();
    }
    return ticket;
  }

  async updateTicket(
    organizerId: string,
    idParam: TicketIdParam,
    ticketDto: UpdateTicketDto,
  ) {
    const [[event], [ticket]] = await Promise.all([
      this.knex<Event>(TableName.EVENTS)
        .where({ id: idParam.id, creator_id: organizerId })
        .select('id'),
      this.knex<Ticket>(TableName.TICKETS).where({
        id: idParam.ticket_id,
        event_id: idParam.id,
      }),
    ]);
    if (!event) {
      throw new EventNotFoundException();
    }
    if (!ticket) {
      throw new TicketNotFoundException();
    }

    const [updatedTicket] = await this.knex<Ticket>(TableName.TICKETS)
      .where('id', ticket.id)
      .update({
        name: ticketDto.name || ticket.name,
        description: ticketDto.description || ticket.description,
        price: ticketDto.price || ticket.price,
        available_quantity:
          ticketDto.available_quantity || ticket.available_quantity,
      } as Ticket)
      .returning('*');

    return updatedTicket;
  }

  async deleteTicket(organizerId: string, idParam: TicketIdParam) {
    const [[event], [ticket]] = await Promise.all([
      this.knex<Event>(TableName.EVENTS).where({
        id: idParam.id,
        creator_id: organizerId,
      }),
      this.knex<Ticket>(TableName.TICKETS).where({
        id: idParam.ticket_id,
        event_id: idParam.id,
      }),
    ]);
    if (!event) {
      throw new EventNotFoundException();
    }
    if (!ticket) {
      throw new TicketNotFoundException();
    }
    const deletedTicket = await this.knex<Ticket>(TableName.TICKETS)
      .where({ id: idParam.ticket_id })
      .delete();
    if (deletedTicket === 0) {
      throw new TicketNotFoundException();
    }
  }
}

export class EventNotFoundException extends NotFoundException {
  constructor() {
    super('event not found');
  }
}

export class TicketNotFoundException extends NotFoundException {
  constructor() {
    super('ticket not found');
  }
}
