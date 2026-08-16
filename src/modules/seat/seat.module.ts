import { Module } from '@nestjs/common';
import { SeatService } from './seat.service';
import { SeatController } from './seat.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Seat } from './entities/seat.entity';
import { Booking } from '../booking/entities/booking.entity';
import { BullModule } from '@nestjs/bullmq';
import { SEAT_LOCK_QUEUE } from './constants';

@Module({
  imports: [
    TypeOrmModule.forFeature([Seat, Booking]),
    BullModule.registerQueue({ name: SEAT_LOCK_QUEUE }),
  ],
  controllers: [SeatController],
  providers: [SeatService],
})
export class SeatModule { }