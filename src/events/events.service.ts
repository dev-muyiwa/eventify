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

@Injectable()
export class EventsService {
  private readonly eventsQuery: Knex.QueryBuilder<Event>;
  private readonly activeEventsQuery: Knex.QueryBuilder<Event>;
  private readonly ticketsQuery: Knex.QueryBuilder<Ticket>;

  constructor(@Inject(KNEX_CONNECTION) private readonly knex: Knex) {
    this.eventsQuery = this.knex<Event>('events');
    this.activeEventsQuery = this.knex<Event>('active_events');
    this.ticketsQuery = this.knex<Ticket>('tickets');
  }

  async createEvent(creatorId: string, createEventDto: CreateEventDto) {
    const { name, description, startDate, endDate, location } = createEventDto;
    const [existingEvent] = await this.activeEventsQuery
      .where('name', name)
      .andWhere('creator_id', creatorId);

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
    return await paginate<Event>(this.eventsQuery, 1);
  }

  async findAllActiveEvents() {
    return await paginate<Event>(
      this.activeEventsQuery,
      1,
      'created_at',
      'desc',
    );
  }

  async findOne(id: string) {
    const [event] = await this.eventsQuery.where('id', id);
    if (!event) {
      throw new EventNotFoundException();
    }
    return event;
  }

  async updateEvent(eventId: string, updateEventDto: UpdateEventDto) {
    const { name, description, startDate, endDate, location } = updateEventDto;
    const [event] = await this.eventsQuery.where('id', eventId);
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
    const [event] = await this.eventsQuery.where({
      id: eventId,
      creator_id: creatorId,
    });
    if (!event) {
      throw new EventNotFoundException();
    }

    if (event.published_at) {
      throw new BadRequestException('event is already published');
    }

    const tickets = await this.ticketsQuery.where('event_id', event.id).first();
    if (!tickets) {
      throw new BadRequestException('event has no tickets');
    }

    const [publishedEvent] = await this.eventsQuery
      .where('id', eventId)
      .update({ published_at: new Date() })
      .returning('*');

    return publishedEvent;
  }

  async deleteEvent(eventId: string, creatorId: string) {
    const event = await this.eventsQuery
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
    const [event] = await this.eventsQuery.where({
      id: eventId,
      creator_id: organizerId,
    });
    if (!event) {
      throw new EventNotFoundException();
    }

    if (event.published_at) {
      throw new BadRequestException('event is already published');
    }

    const [ticket] = await this.ticketsQuery
      .insert({
        name: ticketDto.name,
        description: ticketDto.description,
        price: ticketDto.price,
        total_quantity: ticketDto.total_quantity,
        event_id: event.id,
      } as Ticket)
      .returning('*');

    return ticket;
  }

  async getTickets(eventId: string) {
    const [event] = await this.eventsQuery.where('id', eventId);
    if (!event) {
      throw new EventNotFoundException();
    }

    return await paginate<Ticket>(
      this.ticketsQuery.where('event_id', event.id),
      1,
    );
  }

  async getTicket(idParam: TicketIdParam) {
    const [event, ticket] = await Promise.all([
      this.eventsQuery.where('id', idParam.id).first(),
      this.ticketsQuery.where('id', idParam.ticket_id).first(),
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
    const [event, ticket] = await Promise.all([
      this.eventsQuery
        .where({ id: idParam.id, creator_id: organizerId })
        .first(),
      this.ticketsQuery
        .where({ id: idParam.ticket_id, event_id: idParam.id })
        .first(),
    ]);
    if (!event) {
      throw new EventNotFoundException();
    }
    if (!ticket) {
      throw new TicketNotFoundException();
    }

    const [updatedTicket] = await this.ticketsQuery
      .where('id', ticket.id)
      .update({
        name: ticketDto.name || ticket.name,
        description: ticketDto.description || ticket.description,
        price: ticketDto.price || ticket.price,
        total_quantity: ticketDto.total_quantity || ticket.total_quantity,
      } as Ticket)
      .returning('*');

    return updatedTicket;
  }

  async deleteTicket(organizerId: string, idParam: TicketIdParam) {
    const [event, ticket] = await Promise.all([
      this.eventsQuery
        .where({ id: idParam.id, creator_id: organizerId })
        .first(),
      this.ticketsQuery
        .where({ id: idParam.ticket_id, event_id: idParam.id })
        .first(),
    ]);
    if (!event) {
      throw new EventNotFoundException();
    }
    if (!ticket) {
      throw new TicketNotFoundException();
    }
    const deletedTicket = await this.ticketsQuery
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
