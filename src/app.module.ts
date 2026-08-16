import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';


import { ConfigModule } from '@nestjs/config';
import { UsersModule } from './modules/users/users.module';
import { BookingsModule } from './modules/booking/booking.module';
import { SeatModule } from './modules/seat/seat.module';
import { EventModule } from './modules/event/event.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Seat } from './modules/seat/entities/seat.entity';
import { User } from './modules/users/entities/user.entity';
import { AuthModule } from './modules/auth/auth.module';
import { QueuesModule } from './modules/queues/queues.module';
import { RedisModule } from './modules/redis/redis.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),


    DatabaseModule, UsersModule, BookingsModule, SeatModule, EventModule, TypeOrmModule.forFeature([Seat, Event, User]), AuthModule, QueuesModule, RedisModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
