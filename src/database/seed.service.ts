import { Injectable, OnApplicationBootstrap, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Event } from 'src/modules/event/entities/event.entity';
import { Seat, SeatStatus } from 'src/modules/seat/entities/seat.entity';
import { User } from 'src/modules/users/entities/user.entity';

@Injectable()
export class SeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    @InjectRepository(Event)
    private readonly eventRepository: Repository<Event>,
    @InjectRepository(Seat)
    private readonly seatRepository: Repository<Seat>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) { }

  async onApplicationBootstrap() {
    await this.seedData();
  }

  private async seedData() {
    const eventCount = await this.eventRepository.count();
    if (eventCount >= 20) {
      this.logger.log('Database already has 20 events. Skipping seeding.');
      return;
    }

    if (eventCount > 0) {
      this.logger.log('Resetting old seeded data to seed 20 fresh events...');
      await this.seatRepository.createQueryBuilder().delete().execute();
      await this.eventRepository.createQueryBuilder().delete().execute();
    }

    this.logger.log('🌱 Seeding 20 sample events and seats...');

    // 1. Create 5 Sample Dummy Users
    const userCount = await this.userRepository.count();
    if (userCount === 0) {
      const passwordHash = await bcrypt.hash('password123', 10);
      const dummyUsers = [
        { email: 'user1@gmail.com', name: 'User One', passwordHash },
        { email: 'user2@gmail.com', name: 'User Two', passwordHash },
        { email: 'user3@gmail.com', name: 'User Three', passwordHash },
        { email: 'user4@gmail.com', name: 'User Four', passwordHash },
        { email: 'user5@gmail.com', name: 'User Five', passwordHash },
      ];
      await this.userRepository.save(this.userRepository.create(dummyUsers));
      this.logger.log('👤 Created 5 sample dummy users (user1@gmail.com to user5@gmail.com).');
    }

    // 2. Sample Event Titles
    const eventTitles = [
      'NestJS Concurrency & Performance Masterclass',
      'Tech Summit Yangon 2026',
      'International Music Festival',
      'Rock Legends Live Concert',
      'AI & Machine Learning Symposium',
      'Cloud Native & DevOps Bootcamp',
      'JavaScript & Node.js Developer Forum',
      'Cybersecurity & Ethical Hacking Summit',
      'Fullstack Web Development Conference',
      'UI/UX Design Trends Workshop',
      'Mobile App Innovation Expo',
      'Database Architecture & Optimization Seminar',
      'Startup Pitch & Venture Capital Night',
      'Jazz & Blues Acoustic Evening',
      'Symphony Orchestra Gala 2026',
      'Standup Comedy Night',
      'E-Commerce & Fintech World Summit',
      'Blockchain & Web3 Developers Meetup',
      'Game Development Showcase',
      'Product Management Leadership Forum',
    ];

    // 3. Create 20 Events and 50 Seats per Event
    for (let index = 0; index < eventTitles.length; index++) {
      const title = eventTitles[index];
      const event = this.eventRepository.create({
        title,
        description: `Experience ${title} with high performance and interactive sessions.`,
        venue: `Convention Hall ${String.fromCharCode(65 + (index % 5))}`,
        eventDate: new Date(Date.now() + (index + 1) * 24 * 60 * 60 * 1000), // Spaced days out
        totalSeats: 50,
      });
      const savedEvent = await this.eventRepository.save(event);

      const seats: Partial<Seat>[] = [];
      for (let i = 1; i <= 50; i++) {
        seats.push({
          eventId: savedEvent.id,
          seatNumber: `A-${i}`,
          price: 50.0 + (index % 5) * 10,
          status: SeatStatus.AVAILABLE,
        });
      }
      await this.seatRepository.save(seats);
    }

    this.logger.log('✅ Seeding complete! 20 Events with 1,000 total seats created.');

  }
}
