import { Seat } from "src/modules/seat/entities/seat.entity";
import { User } from "src/modules/users/entities/user.entity";
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToMany, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

export enum BookingStatus {
    PENDING = 'PENDING',
    CONFIRMED = 'CONFIRMED',

    EXPIRED = 'EXPIRED',

    CANCELLED = 'CANCELLED',
}

@Entity('bookings')
export class Booking {
    @PrimaryGeneratedColumn('uuid')
    id: string

    @Column({ type: 'uuid' })
    userId: string

    @Column({ type: 'uuid' })
    seatId: string

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    amount: number

    @Column({ type: 'enum', enum: BookingStatus, default: BookingStatus.PENDING })
    status: BookingStatus


    @Column({ type: 'timestamp' })
    expiresAt: Date

    @CreateDateColumn()
    createdAt: Date

    @UpdateDateColumn()
    updatedAt: Date

    @ManyToOne(() => User, (user) => user.bookings, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'userId' })
    user: User


    @ManyToOne(() => Seat, (seat) => seat.bookings, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'seatId' })
    seat: Seat
}