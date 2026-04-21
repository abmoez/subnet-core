import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UsersRepository } from './users.repository';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UsersService {
  private readonly SALT_ROUNDS = 12;

  constructor(private readonly usersRepository: UsersRepository) {}

  async findById(id: string): Promise<User> {
    const user = await this.usersRepository.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findByEmail(email);
  }

  async create(dto: CreateUserDto): Promise<User> {
    const exists = await this.usersRepository.existsByEmail(dto.email);
    if (exists) {
      throw new ConflictException('Email already registered');
    }

    const hashedPassword = await bcrypt.hash(dto.password, this.SALT_ROUNDS);
    return this.usersRepository.create({
      email: dto.email,
      password: hashedPassword,
    });
  }

  async updateRefreshToken(userId: string, refreshToken: string | null): Promise<void> {
    const hashed = refreshToken ? await bcrypt.hash(refreshToken, this.SALT_ROUNDS) : null;
    await this.usersRepository.update(userId, { refreshToken: hashed });
  }

  async validateRefreshToken(userId: string, refreshToken: string): Promise<boolean> {
    const user = await this.usersRepository.findById(userId);
    if (!user || !user.refreshToken) return false;
    return bcrypt.compare(refreshToken, user.refreshToken);
  }
}
