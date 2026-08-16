import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt'

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,) { }

  async findAll(): Promise<User[]> {
    return this.userRepository.find({
      order: { createdAt: 'ASC' },
      select: { id: true, email: true, name: true, createdAt: true }
    })
  }

  async findOne(id: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      select: { id: true, email: true, name: true, createdAt: true }
    })
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`)
    }
    return user;
  }


  async createUser(email: string, name: string, password = 'password123'): Promise<User> {
    const existing = await this.userRepository.findOne({ where: { email } })
    if (existing) {
      throw new ConflictException(`User with email ${email} already exists`)
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = this.userRepository.create({
      email, name, passwordHash
    })

    const saved = await this.userRepository.save(user);
    delete (saved as any).passwordHash;
    return saved;
  }

  async findByEmailWithPassword(email: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { email },
    })
  }
}
