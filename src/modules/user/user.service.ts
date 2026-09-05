import { randomUUID } from 'crypto';

import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Auth0Payload } from '~common/auth';
import { parseDateOfBirth } from '~common/utils/date-only.utils';

import { CreateUserWithoutAuth0Dto } from './dto/create-user-without-auth0.dto';
import { UpdateUserDto } from './dto/update-user.dto';
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
    const { firstName, lastName } = namesFromAuth0Payload(payload);
    const email = payload.email?.trim() || null;

    let user = await this.findByAuth0Id(payload.sub);

    if (user) {
      const patch: Partial<User> = {};
      if (!user.email && email) patch.email = email;
      if (!user.firstName && firstName) patch.firstName = firstName;
      if (!user.lastName && lastName) patch.lastName = lastName;
      if (Object.keys(patch).length === 0) {
        return user;
      }
      await this.userRepository.update(user.id, patch);
      const updated = await this.findByAuth0Id(payload.sub);
      return updated ?? user;
    }

    user = this.userRepository.create({
      auth0Id: payload.sub,
      email,
      firstName,
      lastName,
      gender: null,
      dateOfBirth: null,
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
   * Create a user without Auth0 (e.g. club member added by owner).
   * Uses placeholder auth0Id so the user can be linked to Auth0 later.
   */
  async createWithoutAuth0(data: CreateUserWithoutAuth0Dto): Promise<User> {
    const auth0Id = `pending:${randomUUID()}`;
    const user = this.userRepository.create({
      auth0Id,
      clubId: data.clubId,
      roles: data.roles,
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email ?? null,
      gender: data.gender,
      dateOfBirth: parseDateOfBirth(data.dateOfBirth),
      weight: data.weight ?? null,
      beltLevel: data.beltLevel,
    });
    const saved = await this.userRepository.save(user);
    this.logger.log(`Created user without Auth0: ${saved.id} (clubId: ${data.clubId})`);
    return saved;
  }

  /**
   * Update user profile
   */
  async update(id: string, data: UpdateUserDto): Promise<User> {
    // Convert string date to Date object if provided
    const updateData: Partial<User> = {};

    if (data.firstName !== undefined) updateData.firstName = data.firstName || null;
    if (data.lastName !== undefined) updateData.lastName = data.lastName || null;
    if (data.email !== undefined) updateData.email = data.email || null;
    if (data.gender !== undefined) updateData.gender = data.gender || null;
    if (data.dateOfBirth !== undefined) {
      updateData.dateOfBirth = data.dateOfBirth ? parseDateOfBirth(data.dateOfBirth) : null;
    }
    if (data.weight !== undefined) updateData.weight = data.weight || null;
    if (data.beltLevel !== undefined) updateData.beltLevel = data.beltLevel || null;
    if (data.roles !== undefined) updateData.roles = data.roles;
    if (data.clubId !== undefined) updateData.clubId = data.clubId || null;

    await this.userRepository.update(id, updateData);
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

function namesFromAuth0Payload(payload: Auth0Payload): { firstName: string | null; lastName: string | null } {
  const given = payload.given_name?.trim() || null;
  const family = payload.family_name?.trim() || null;
  if (given || family) {
    return { firstName: given, lastName: family };
  }

  if (payload.name) {
    const nameParts = payload.name.trim().split(/\s+/);
    if (nameParts.length > 0) {
      return {
        firstName: nameParts[0],
        lastName: nameParts.length > 1 ? nameParts.slice(1).join(' ') : null,
      };
    }
  }

  if (payload.nickname) {
    return { firstName: payload.nickname, lastName: null };
  }

  return { firstName: null, lastName: null };
}
