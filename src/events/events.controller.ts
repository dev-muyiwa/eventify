import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Req,
} from '@nestjs/common';
import { EventsService } from './events.service';
import { CreateEventDto } from './dto/create-event.dto';
import { IdParam, TicketIdParam, UpdateEventDto } from './dto/update-event.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { User, UserRole } from '../user/entities/user.entity';
import { success } from '../util/function';
import { Roles } from '../auth/guards/roles.guard';
import { CreateTicketDto, UpdateTicketDto } from './dto/create-ticket.dto';

@Controller('events')
@ApiTags('Events')
@ApiBearerAuth()
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Post()
  @Roles(UserRole.ORGANIZER)
  async createEvent(
    @Req() req: Request,
    @Body() createEventDto: CreateEventDto,
  ) {
    const user = req.user as User;
    const event = await this.eventsService.createEvent(user.id, createEventDto);
    return success(event, 'event created');
  }

  @Get()
  async findAll() {
    const events = await this.eventsService.findAllActiveEvents();
    return success(events, 'events fetched');
  }

  @Get()
  // @Roles(UserRole.ORGANIZER, UserRole.ADMIN)
  findAllActiveEvents() {
    return this.eventsService.findAllActiveEvents();
  }

  @Get(':id')
  async findOne(@Param() idParam: IdParam) {
    const event = await this.eventsService.findOne(idParam.id);
    return success(event, 'event fetched');
  }

  @Patch(':id')
  @Roles(UserRole.ORGANIZER)
  async updateEvent(
    @Param() idParam: IdParam,
    @Body() updateEventDto: UpdateEventDto,
  ) {
    const event = await this.eventsService.updateEvent(
      idParam.id,
      updateEventDto,
    );
    return success(event, 'event updated');
  }

  @Put(':id')
  @Roles(UserRole.ORGANIZER)
  async publishEvent(@Req() req: Request, @Param() idParam: IdParam) {
    const admin = req.user as User;
    const event = await this.eventsService.publishEvent(idParam.id, admin.id);
    return success(event, 'event published');
  }

  @Delete(':id')
  @Roles(UserRole.ORGANIZER, UserRole.ADMIN)
  async deleteEvent(@Req() req: Request, @Param() idParam: IdParam) {
    const admin = req.user as User;
    await this.eventsService.deleteEvent(idParam.id, admin.id);
    return success(null, 'event deleted');
  }

  @Roles(UserRole.ORGANIZER)
  @Post(':id/tickets')
  async createTicket(
    @Req() req: Request,
    @Param() idParam: IdParam,
    @Body() createTicketDto: CreateTicketDto,
  ) {
    const organizer = req.user as User;
    const ticket = await this.eventsService.createTicket(
      idParam.id,
      organizer.id,
      createTicketDto,
    );
    return success(ticket, 'ticket created');
  }

  @Get(':id/tickets')
  async getTickets(@Param() idParam: IdParam) {
    const tickets = await this.eventsService.getTickets(idParam.id);
    return success(tickets, 'tickets fetched');
  }

  @Get(':id/tickets/:ticket_id')
  async getTicket(@Param() idParam: TicketIdParam) {
    const ticket = await this.eventsService.getTicket(idParam);
    return success(ticket, 'ticket fetched');
  }

  @Roles(UserRole.ORGANIZER)
  @Patch(':id/tickets/:ticket_id')
  async updateTicket(
    @Req() req: Request,
    @Param() idParam: TicketIdParam,
    @Body() updateTicketDto: UpdateTicketDto,
  ) {
    const organizer = req.user as User;
    const ticket = await this.eventsService.updateTicket(
      organizer.id,
      idParam,
      updateTicketDto,
    );
    return success(ticket, 'ticket updated');
  }

  @Roles(UserRole.ORGANIZER)
  @Delete(':id/tickets/:ticket_id')
  async deleteTicket(@Req() req: Request, @Param() idParam: TicketIdParam) {
    const organizer = req.user as User;
    await this.eventsService.deleteTicket(organizer.id, idParam);
    return success(null, 'ticket deleted');
  }

  @Post(':id/tickets/:ticket_id/cart')
  async addTicketToCart(@Req() req: Request, @Param() idParam: TicketIdParam) {
    const user = req.user as User;
    // await this.eventsService.purchaseTicket(user.id, idParam);
    return success(null, 'ticket purchased');
  }
}
