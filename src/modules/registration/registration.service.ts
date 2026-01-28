import { Injectable, NotFoundException, ConflictException, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { RegistrationStatus } from '~common/enums';

import { UserService } from '../user/user.service';
import { User } from '../user/user.entity';
import { Tournament } from '../tournament/tournament.entity';
import { Category } from '../category/category.entity';
import { Club } from '../club/club.entity';
import { Registration } from './registration.entity';
import { CreateRegistrationDto } from './dto/create-registration.dto';
import { CreateRegistrationWithUserDto } from './dto/create-registration-with-user.dto';

/**
 * Registration Service
 * Handles registration-related business logic and database operations.
 */
@Injectable()
export class RegistrationService {
  private readonly logger = new Logger(RegistrationService.name);

  constructor(
    @InjectRepository(Registration)
    private readonly registrationRepository: Repository<Registration>,
    @InjectRepository(Tournament)
    private readonly tournamentRepository: Repository<Tournament>,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    @InjectRepository(Club)
    private readonly clubRepository: Repository<Club>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly userService: UserService,
  ) {}

  /**
   * Create a new registration
   */
  async create(data: CreateRegistrationDto, authenticatedUserId?: string): Promise<Registration> {
    // Determine userId - use provided userId or authenticated user
    const userId = data.userId || authenticatedUserId;
    if (!userId) {
      throw new BadRequestException('User ID is required');
    }

    // Validate user exists
    const user = await this.userService.findById(userId);
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    // Validate tournament exists
    const tournament = await this.tournamentRepository.findOne({
      where: { id: data.tournamentId },
    });
    if (!tournament) {
      throw new NotFoundException(`Tournament with ID ${data.tournamentId} not found`);
    }

    // Validate category exists
    const category = await this.categoryRepository.findOne({
      where: { id: data.categoryId },
    });
    if (!category) {
      throw new NotFoundException(`Category with ID ${data.categoryId} not found`);
    }

    // Validate club exists
    const club = await this.clubRepository.findOne({
      where: { id: data.clubId },
    });
    if (!club) {
      throw new NotFoundException(`Club with ID ${data.clubId} not found`);
    }

    // Check for duplicate registration
    const existing = await this.registrationRepository.findOne({
      where: {
        userId,
        tournamentId: data.tournamentId,
        categoryId: data.categoryId,
      },
    });

    if (existing) {
      throw new ConflictException(
        `Registration already exists for user ${userId} in tournament ${data.tournamentId} and category ${data.categoryId}`,
      );
    }

    // Create registration
    const registration = this.registrationRepository.create({
      userId,
      tournamentId: data.tournamentId,
      categoryId: data.categoryId,
      clubId: data.clubId,
      status: RegistrationStatus.PENDING,
      finalWeight: data.finalWeight ?? null,
    });

    try {
      const saved = await this.registrationRepository.save(registration);
      this.logger.log(`Created registration: ${saved.id} for user ${userId}`);
      return saved;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Failed to create registration: ${errorMessage}`, errorStack);
      throw error;
    }
  }

  /**
   * Create registration with user (public endpoint)
   * Creates or updates user from email/name, then creates registration
   */
  async createWithUser(data: CreateRegistrationWithUserDto): Promise<Registration> {
    // Find or create user by email
    let user = await this.userRepository.findOne({
      where: { auth0Id: `temp-${data.email}` },
    });

    // Calculate birthDate from age if provided
    let birthDate: Date | null = null;
    if (data.age) {
      const today = new Date();
      birthDate = new Date(today.getFullYear() - data.age, today.getMonth(), today.getDate());
    }

    if (user) {
      // Update existing user
      user.firstName = data.firstName;
      user.lastName = data.lastName;
      if (data.weight !== undefined) user.weight = data.weight;
      if (data.gender !== undefined) user.gender = data.gender;
      if (data.beltLevel !== undefined) user.beltLevel = data.beltLevel;
      if (birthDate) user.birthDate = birthDate;
      if (data.clubId) user.clubId = data.clubId;

      user = await this.userRepository.save(user);
      this.logger.log(`Updated user: ${user.id} from email ${data.email}`);
    } else {
      // Create new user with temporary auth0Id
      // Generate a unique auth0Id based on email
      const tempAuth0Id = `temp-${data.email}`;

      // Check if this temp auth0Id already exists (shouldn't happen, but just in case)
      const existingByAuth0 = await this.userRepository.findOne({
        where: { auth0Id: tempAuth0Id },
      });

      if (existingByAuth0) {
        // If somehow it exists, use that user
        user = existingByAuth0;
        user.firstName = data.firstName;
        user.lastName = data.lastName;
        if (data.weight !== undefined) user.weight = data.weight;
        if (data.gender !== undefined) user.gender = data.gender;
        if (data.beltLevel !== undefined) user.beltLevel = data.beltLevel;
        if (birthDate) user.birthDate = birthDate;
        if (data.clubId) user.clubId = data.clubId;
        user = await this.userRepository.save(user);
      } else {
        // Create new user
        user = this.userRepository.create({
          auth0Id: tempAuth0Id,
          firstName: data.firstName,
          lastName: data.lastName,
          weight: data.weight ?? null,
          gender: data.gender ?? null,
          beltLevel: data.beltLevel ?? null,
          birthDate,
          clubId: data.clubId ?? null,
          roles: [],
        });

        user = await this.userRepository.save(user);
        this.logger.log(`Created new user: ${user.id} from email ${data.email}`);
      }
    }

    // Validate tournament exists
    const tournament = await this.tournamentRepository.findOne({
      where: { id: data.tournamentId },
    });
    if (!tournament) {
      throw new NotFoundException(`Tournament with ID ${data.tournamentId} not found`);
    }

    // Validate category exists
    const category = await this.categoryRepository.findOne({
      where: { id: data.categoryId },
    });
    if (!category) {
      throw new NotFoundException(`Category with ID ${data.categoryId} not found`);
    }

    // Validate club exists if provided
    if (data.clubId) {
      const club = await this.clubRepository.findOne({
        where: { id: data.clubId },
      });
      if (!club) {
        throw new NotFoundException(`Club with ID ${data.clubId} not found`);
      }
    } else {
      // If no clubId provided, use user's clubId
      if (!user.clubId) {
        throw new BadRequestException('Club ID is required for registration');
      }
    }

    // Check for duplicate registration
    const existing = await this.registrationRepository.findOne({
      where: {
        userId: user.id,
        tournamentId: data.tournamentId,
        categoryId: data.categoryId,
      },
    });

    if (existing) {
      throw new ConflictException(
        `Registration already exists for user ${user.id} in tournament ${data.tournamentId} and category ${data.categoryId}`,
      );
    }

    // Create registration
    const registration = this.registrationRepository.create({
      userId: user.id,
      tournamentId: data.tournamentId,
      categoryId: data.categoryId,
      clubId: data.clubId || user.clubId!,
      status: RegistrationStatus.PENDING,
      finalWeight: data.finalWeight ?? null,
    });

    try {
      const saved = await this.registrationRepository.save(registration);
      this.logger.log(`Created registration: ${saved.id} for user ${user.id} (from email ${data.email})`);
      return saved;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Failed to create registration: ${errorMessage}`, errorStack);
      throw error;
    }
  }

  /**
   * Find registration by ID
   */
  async findById(id: string): Promise<Registration | null> {
    return this.registrationRepository.findOne({
      where: { id },
      relations: ['user', 'tournament', 'category', 'club'],
    });
  }

  /**
   * Find all registrations for a user
   */
  async findByUser(userId: string): Promise<Registration[]> {
    return this.registrationRepository.find({
      where: { userId },
      relations: ['tournament', 'category', 'club'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Update registration status
   */
  async updateStatus(id: string, status: RegistrationStatus): Promise<Registration> {
    const registration = await this.findById(id);
    if (!registration) {
      throw new NotFoundException(`Registration with ID ${id} not found`);
    }

    registration.status = status;
    return this.registrationRepository.save(registration);
  }
}
