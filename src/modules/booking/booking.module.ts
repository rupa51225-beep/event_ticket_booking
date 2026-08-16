import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Booking } from './entities/booking.entity';
import { Seat } from '../seat/entities/seat.entity';
import { BookingsService } from './booking.service';
import { BookingsController } from './booking.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Booking, Seat])],
  controllers: [BookingsController],
  providers: [BookingsService],
  exports: [BookingsService],
})
export class BookingsModule { }