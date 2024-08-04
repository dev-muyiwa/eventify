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
import { UpdateEventDto } from './dto/update-event.dto';
import { ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { User } from '../user/entities/user.entity';
import { success } from '../util/function';

@Controller('events')
@ApiTags('Events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Post()
  async createEvent(
    @Req() req: Request,
    @Body() createEventDto: CreateEventDto,
  ) {
    const user = req.user as User;
    const event = await this.eventsService.createEvent(createEventDto, user.id);
    return success(event, 'event created');
  }

  @Get()
  async findAll() {
    const events = await this.eventsService.findAllEvents();
    return success(events, 'events fetched');
  }

  // @Get()
  // findAllActiveEvents() {
  //   return this.eventsService.findAllActiveEvents();
  // }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const event = await this.eventsService.findOne(id);
    return success(event, 'event fetched');
  }

  @Patch(':id')
  async updateEvent(
    @Param('id') id: string,
    @Body() updateEventDto: UpdateEventDto,
  ) {
    const event = await this.eventsService.updateEvent(id, updateEventDto);
    return success(event, 'event updated');
  }

  @Put(':id')
  async publishEvent(@Req() req: Request, @Param('id') id: string) {
    const admin = req.user as User;
    const event = await this.eventsService.publishEvent(id, admin.id);
    return success(event, 'event updated');
  }

  @Delete(':id')
  async deleteEvent(@Req() req: Request, @Param('id') id: string) {
    const admin = req.user as User;
    await this.eventsService.deleteEvent(id, admin.id);
    return success(null, 'event deleted');
  }
}
