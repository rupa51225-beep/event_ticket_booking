import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
  Inject,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import Redis from 'ioredis';
import { Seat, SeatStatus } from './entities/seat.entity';
import { Booking, BookingStatus } from '../booking/entities/booking.entity';
import { RedisLockService, REDIS_CLIENT } from '../redis/redis-lock.service';
import { SEAT_EXPIRATION_QUEUE, SeatExpirationJobData } from '../queues/seat-expiration.processor';

@Injectable()
export class SeatsService {
  private readonly logger = new Logger(SeatsService.name);

  constructor(
    @InjectRepository(Seat)
    private readonly seatRepository: Repository<Seat>,
    @InjectRepository(Booking)
    private readonly bookingRepository: Repository<Booking>,
    private readonly redisLockService: RedisLockService,
    @Inject(REDIS_CLIENT)
    private readonly redisClient: Redis,
    @InjectQueue(SEAT_EXPIRATION_QUEUE)
    private readonly expirationQueue: Queue<SeatExpirationJobData>,
  ) { }

  /**
   * Redis Cache-Aside Pattern for Seat Layout Query
   */
  async findByEvent(eventId: string): Promise<Seat[]> {
    const cacheKey = `cache:event:${eventId}:seats`;

    // 1. Check Redis Cache
    const cached = await this.redisClient.get(cacheKey);
    if (cached) {
      this.logger.debug(`:zap: Redis Cache HIT: Event seats layout (${eventId})`);
      return JSON.parse(cached);
    }

    // 2. Query PostgreSQL Database on Cache Miss
    const seats = await this.seatRepository.find({
      where: { eventId },
      order: { seatNumber: 'ASC' },
    });

    // 3. Cache result in Redis for 10 seconds
    await this.redisClient.set(cacheKey, JSON.stringify(seats), 'EX', 10);
    this.logger.debug(`:turtle: Redis Cache MISS: Loaded from PostgreSQL and cached (${eventId})`);

    return seats;
  }

  async findOne(id: string): Promise<Seat> {
    const seat = await this.seatRepository.findOne({ where: { id } });
    if (!seat) {
      throw new NotFoundException(`Seat with ID ${id} not found`);
    }
    return seat;
  }

  private async invalidateCache(eventId: string): Promise<void> {
    const cacheKey = `cache:event:${eventId}:seats`;
    await this.redisClient.del(cacheKey);
    this.logger.debug(`:broom: Cleared Redis Cache for Event seats: ${eventId}`);
  }

  /**
   * Concurrency-Safe Seat Reservation (5-Minute Hold)
   */
  async holdSeat(seatId: string, userId: string): Promise<{ seat: Seat; booking: Booking }> {
    const lockKey = `lock:seat:${seatId}`;

    // 1. Try to acquire Redis Atomic Lock (5-second execution lock TTL)
    const lockToken = await this.redisLockService.acquireLock(lockKey, 5000);
    if (!lockToken) {
      throw new ConflictException(
        'Seat is currently being processed by another user. Please try again.',
      );
    }

    try {
      // 2. Fetch fresh seat state from database
      const seat = await this.seatRepository.findOne({ where: { id: seatId } });
      if (!seat) {
        throw new NotFoundException(`Seat with ID ${seatId} not found`);
      }

      // Check if seat is already HELD or BOOKED
      if (seat.status !== SeatStatus.AVAILABLE) {
        throw new ConflictException(
          `Seat ${seat.seatNumber} is no longer available (Status: ${seat.status}).`,
        );
      }

      // 3. Set 5-Minute Hold Expiration Timestamp
      const holdDurationMinutes = 5;
      const heldUntil = new Date(Date.now() + holdDurationMinutes * 60 * 1000);

      seat.status = SeatStatus.HELD;
      seat.heldByUserId = userId;
      seat.heldUntil = heldUntil;

      const updatedSeat = await this.seatRepository.save(seat);

      // 4. Create PENDING Booking record
      const booking = this.bookingRepository.create({
        userId,
        seatId: seat.id,
        amount: seat.price,
        status: BookingStatus.PENDING,
        expiresAt: heldUntil,
      });

      const savedBooking = await this.bookingRepository.save(booking);

      // 5. Enqueue BullMQ Delayed Expiration Job (5 mins / 300,000 ms)
      const delayMs = holdDurationMinutes * 60 * 1000;
      await this.expirationQueue.add(
        'expire-seat',
        { seatId: seat.id, bookingId: savedBooking.id },
        { delay: delayMs },
      );

      // Invalidate Redis Seat Layout Cache
      await this.invalidateCache(seat.eventId);

      this.logger.log(
        `:tada: Seat ${seat.seatNumber} successfully HELD for user ${userId}. Delayed BullMQ job enqueued for ${holdDurationMinutes} mins.`,
      );

      return { seat: updatedSeat, booking: savedBooking };
    } finally {
      // 6. Always release Redis Distributed Lock
      await this.redisLockService.releaseLock(lockKey, lockToken);
    }
  }
}