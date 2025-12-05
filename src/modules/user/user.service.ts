import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Auth0Payload } from '~common/auth';

import { User } from './user.entity';

/**
 * User Service
 * Handles user-related business logic and database operations.
 */
@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /**
   * Find a user by Auth0 ID
   */
  async findByAuth0Id(auth0Id: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { auth0Id },
      relations: ['club'],
    });
  }

  /**
   * Find a user by ID
   */
  async findById(id: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { id },
      relations: ['club'],
    });
  }

  /**
   * Find or create a user by Auth0 ID
   * If user doesn't exist, creates a new user from Auth0 payload data.
   * This is used for lazy user creation on first authenticated request.
   */
  async findOrCreateByAuth0Id(payload: Auth0Payload): Promise<User> {
    // Try to find existing user
    let user = await this.findByAuth0Id(payload.sub);

    if (user) {
      return user;
    }

    // Extract name from Auth0 payload
    // Auth0 provides: name, nickname, email
    // We'll try to split name into firstName/lastName if available
    let firstName: string | null = null;
    let lastName: string | null = null;

    if (payload.name) {
      const nameParts = payload.name.trim().split(/\s+/);
      if (nameParts.length > 0) {
        firstName = nameParts[0];
        if (nameParts.length > 1) {
          lastName = nameParts.slice(1).join(' ');
        }
      }
    } else if (payload.nickname) {
      // Fallback to nickname if name is not available
      firstName = payload.nickname;
    }

    // Create new user with data from Auth0
    user = this.userRepository.create({
      auth0Id: payload.sub,
      firstName,
      lastName,
      // Other fields remain null and can be filled later via profile update
      gender: null,
      birthDate: null,
      weight: null,
      beltLevel: null,
      clubId: null,
      roles: [],
    });

    try {
      user = await this.userRepository.save(user);
      this.logger.log(`Created new user from Auth0: ${user.id} (auth0Id: ${user.auth0Id})`);
      return user;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Failed to create user from Auth0 payload: ${errorMessage}`, errorStack);
      throw error;
    }
  }

  /**
   * Update user profile
   */
  async update(id: string, data: Partial<User>): Promise<User> {
    await this.userRepository.update(id, data);
    const updated = await this.findById(id);
    if (!updated) {
      throw new Error(`User not found: ${id}`);
    }
    return updated;
  }

  /**
   * Get all users
   */
  async findAll(): Promise<User[]> {
    return this.userRepository.find({
      relations: ['club'],
    });
  }
}

