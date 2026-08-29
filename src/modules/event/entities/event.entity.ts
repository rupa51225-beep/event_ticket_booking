import { Seat } from "src/modules/seat/entities/seat.entity";
import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity('events')
export class Event {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    title: string;

    @Column({ type: 'text' })
    description: string;

    @Column()
    venue: string;

    @Column()
    eventDate: Date;

    @Column({ type: 'int', default: 50 })
    totalSeats: number

    @CreateDateColumn()
    createdAt: Date

    @UpdateDateColumn()
    updatedAt: Date


    @OneToMany(() => Seat, (seat) => seat.event, { cascade: true })
    seats: Seat[]
}
