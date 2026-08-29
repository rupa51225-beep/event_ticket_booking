import { Controller, Get, Post, Body, Patch, Param, Delete, HttpCode, HttpStatus } from '@nestjs/common';
import { HoldSeatDto } from './dto/hold_seat.dto';
import { SeatsService } from './seat.service';



@Controller(['seats', 'seat'])
export class SeatController {
  constructor(private readonly seatService: SeatsService) { }

  @Post(':id/hold')
  @HttpCode(HttpStatus.OK)
  async holdSeat(
    @Param('id') seatId: string,
    @Body() holdSeatDto: HoldSeatDto,
  ) {
    return this.seatService.holdSeat(seatId, holdSeatDto.userId)
  }




}
