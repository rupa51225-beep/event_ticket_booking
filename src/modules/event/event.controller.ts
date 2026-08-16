import { Controller, Get, Param } from '@nestjs/common';
import { EventsService } from './event.service';
import { SeatService } from '../seat/seat.service';

@Controller('events')
export class EventsController {
  constructor(
    private readonly eventsService: EventsService,
    // private readonly seatsService: SeatService,
  ) { }

  @Get()
  async getEvents() {
    return this.eventsService.findAll();
  }

  @Get(':id')
  async getEventDetails(@Param('id') id: string) {
    return this.eventsService.findOne(id);
  }

  // @Get(':id/seats')
  // async getEventSeats(@Param('id') eventId: string) {
  //   // Ensure event exists
  //   await this.eventsService.findOne(eventId);
  //   // return this.seatsService.findByEvent(eventId);
  // }
}