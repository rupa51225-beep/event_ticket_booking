import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Booking, BookingStatus } from './entities/booking.entity';
import { Seat, SeatStatus } from '../seat/entities/seat.entity';
import { CreateBookingDto } from './dto/create-booking.dto';

@Injectable()
export class BookingsService {
  private readonly logger = new Logger(BookingsService.name);

  constructor(
    @InjectRepository(Booking)
    private readonly bookingRepository: Repository<Booking>,
    @InjectRepository(Seat)
    private readonly seatRepository: Repository<Seat>,
    private readonly dataSource: DataSource,
  ) { }

  /**
   * Process payment checkout for a held seat booking within the 5-minute window.
   */
  async checkout(dto: CreateBookingDto): Promise<Booking> {
    const { bookingId, userId, paymentMethod } = dto;

    // Use a Database Transaction for Atomic Status Transition
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Fetch Booking with Seat relation inside transaction
      const booking = await queryRunner.manager.findOne(Booking, {
        where: { id: bookingId },
        relations: { seat: { event: true } },
      });

      if (!booking) {
        throw new NotFoundException(`Booking with ID ${bookingId} not found`);
      }

      if (booking.userId !== userId) {
        throw new ForbiddenException(`You do not have access to this booking.`);
      }

      if (booking.status !== BookingStatus.PENDING) {
        throw new ConflictException(
          `Booking ${bookingId} cannot be checked out because its status is ${booking.status}.`,
        );
      }

      // Check if 5-minute expiration timestamp has passed
      if (new Date() > booking.expiresAt) {
        booking.status = BookingStatus.EXPIRED;
        await queryRunner.manager.save(booking);
        throw new ConflictException(
          `Booking ${bookingId} has expired past the 5-minute payment window.`,
        );
      }

      const seat = booking.seat;
      if (!seat || seat.status !== SeatStatus.HELD || seat.heldByUserId !== userId) {
        throw new ConflictException(
          `Seat ${seat?.seatNumber} is no longer held by you.`,
        );
      }

      // 2. Atomic Transition: Seat -> BOOKED, Booking -> CONFIRMED
      seat.status = SeatStatus.BOOKED;
      seat.heldByUserId = null;
      seat.heldUntil = null;
      await queryRunner.manager.save(seat);

      booking.status = BookingStatus.CONFIRMED;
      const updatedBooking = await queryRunner.manager.save(booking);

      await queryRunner.commitTransaction();

      this.logger.log(
        `🎉 Payment Successful via ${paymentMethod}! Booking ${bookingId} CONFIRMED for Seat ${seat.seatNumber}.`,
      );

      return updatedBooking;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async getUserBookings(userId: string): Promise<Booking[]> {
    return this.bookingRepository.find({
      where: { userId },
      relations: { seat: { event: true } },
      order: { createdAt: 'DESC' },
    });
  }

  async getBookingDetails(bookingId: string): Promise<Booking> {
    const booking = await this.bookingRepository.findOne({
      where: { id: bookingId },
      relations: { seat: { event: true }, user: true },
    });

    if (!booking) {
      throw new NotFoundException(`Booking with ID ${bookingId} not found`);
    }

    return booking;
  }
}