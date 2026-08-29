import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { User } from '../modules/users/entities/user.entity';
import { Event } from '../modules/event/entities/event.entity';
import { Seat } from '../modules/seat/entities/seat.entity';
import { Booking } from '../modules/booking/entities/booking.entity';
import { SeedService } from './seed.service';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST', 'localhost'),
        port: configService.get<number>('DB_PORT', 5432),
        username: configService.get<string>('DB_USERNAME', 'postgres'),
        password: configService.get<string>('DB_PASSWORD', 'postgres'),
        database: configService.get<string>('DB_DATABASE', 'ticket_booking'),
        entities: [User, Event, Seat, Booking],
        synchronize: true, // Automatically sync schema in dev mode
        logging: false,
      }),
    }),
    TypeOrmModule.forFeature([User, Event, Seat, Booking]),
  ],
  providers: [SeedService],
  exports: [SeedService],
})
export class DatabaseModule { }
