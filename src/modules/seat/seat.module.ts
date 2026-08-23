import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { Seat } from './entities/seat.entity';
import { Booking } from '../booking/entities/booking.entity';
import { SeatsService } from './seat.service';
import { SeatController } from './seat.controller';
import { SEAT_EXPIRATION_QUEUE } from '../queues/seat-expiration.processor';

@Module({
  imports: [
    TypeOrmModule.forFeature([Seat, Booking]),
    BullModule.registerQueue({
      name: SEAT_EXPIRATION_QUEUE,
    }),
  ],
  controllers: [SeatController],
  providers: [SeatsService],
  exports: [SeatsService, TypeOrmModule],
})
export class SeatsModule { }