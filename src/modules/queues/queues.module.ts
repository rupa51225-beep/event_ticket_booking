import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Seat } from '../seat/entities/seat.entity';
import { Booking } from '../booking/entities/booking.entity';
import {
  SeatExpirationProcessor,
  SEAT_EXPIRATION_QUEUE,
} from './seat-expiration.processor';

@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        connection: {
          host: configService.get<string>('REDIS_HOST', 'localhost'),
          port: configService.get<number>('REDIS_PORT', 6379),
        },
      }),
    }),
    BullModule.registerQueue({
      name: SEAT_EXPIRATION_QUEUE,
    }),
    TypeOrmModule.forFeature([Seat, Booking]),
  ],
  providers: [SeatExpirationProcessor],
  exports: [BullModule],
})
export class QueuesModule { }