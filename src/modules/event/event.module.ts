import { Module } from '@nestjs/common';
import { EventsService } from './event.service';
import { EventsController } from './event.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Event } from './entities/event.entity';
import { SeatsModule } from '../seat/seat.module';
// import { Seat } from '../seat/entities/seat.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Event]), SeatsModule],
  controllers: [EventsController],
  providers: [EventsService],
})
export class EventModule { }
