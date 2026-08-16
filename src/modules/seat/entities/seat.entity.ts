import { Booking } from 'src/modules/booking/entities/booking.entity';
import { Event } from 'src/modules/event/entities/event.entity';
import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
    Index,
    VersionColumn,
    OneToMany,
} from 'typeorm';


export enum SeatStatus {
    AVAILABLE = 'AVAILABLE',
    HELD = 'HELD',
    BOOKED = 'BOOKED',
}

@Entity('seats')
@Index(['eventId', 'status'])
export class Seat {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    eventId: string;

    @Column()
    seatNumber: string; // e.g., "A-1", "A-2"

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    price: number;

    @Column({
        type: 'enum',
        enum: SeatStatus,
        default: SeatStatus.AVAILABLE,
    })
    status: SeatStatus;

    @Column({ type: 'uuid', nullable: true })
    heldByUserId: string | null;

    @Column({ type: 'timestamp', nullable: true })
    heldUntil: Date | null;

    // Optimistic Concurrency Control Version Column
    @VersionColumn()
    version: number;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @ManyToOne(() => Event, (event) => event.seats, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'eventId' })
    event: Event;

    @OneToMany(() => Booking, (booking) => booking.seat)
    bookings: Booking[];
}