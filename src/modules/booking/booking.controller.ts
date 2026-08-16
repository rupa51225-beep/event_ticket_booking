import { Controller, Post, Get, Body, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { BookingsService } from './booking.service';
import { CreateBookingDto } from './dto/create-booking.dto';

@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) { }

  @Post('checkout')
  @HttpCode(HttpStatus.OK)
  async checkout(@Body() dto: CreateBookingDto) {
    return this.bookingsService.checkout(dto);
  }

  @Get('user/:userId')
  async getUserBookings(@Param('userId') userId: string) {
    return this.bookingsService.getUserBookings(userId);
  }

  @Get(':id')
  async getBookingDetails(@Param('id') bookingId: string) {
    return this.bookingsService.getBookingDetails(bookingId);
  }
}