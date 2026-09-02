import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { UserRole } from '~common/enums';

import { InvitationService } from '../invitation/invitation.service';
import { Tournament } from '../tournament/tournament.entity';
import { User } from '../user/user.entity';
import { UserService } from '../user/user.service';

import { Club } from './club.entity';
import { AddMemberDto } from './dto/add-member.dto';
import { CreateClubDto } from './dto/create-club.dto';

export interface CreateClubResult {
  club: Club;
  inviteUrl: string | null;
}

/**
 * Club Service
 * Handles club-related business logic and database operations.
 */
@Injectable()
export class ClubService {
  private readonly logger = new Logger(ClubService.name);

  constructor(
    @InjectRepository(Club)
    private readonly clubRepository: Repository<Club>,
    @InjectRepository(Tournament)
    private readonly tournamentRepository: Repository<Tournament>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly invitationService: InvitationService,
    private readonly userService: UserService,
  ) {}

  /**
   * Create a new club.
   * When ownerEmail is provided, creates an invitation and returns inviteUrl.
   */
  async create(data: CreateClubDto): Promise<CreateClubResult> {
    const club = this.clubRepository.create({
      name: data.name,
      address: data.address ?? null,
      country: data.country ?? null,
    });
    const savedClub = await this.clubRepository.save(club);

    let inviteUrl: string | null = null;
    if (data.ownerEmail?.trim()) {
      const { inviteUrl: url } = await this.invitationService.create(
        savedClub.id,
        data.ownerEmail,
        data.ownerFirstName,
        data.ownerLastName,
      );
      inviteUrl = url;
    }

    return { club: savedClub, inviteUrl };
  }

  /**
   * Find all clubs with members count (no user entities loaded).
   */
  async findAll(): Promise<Club[]> {
    return this.clubRepository
      .createQueryBuilder('club')
      .orderBy('club.name', 'ASC')
      .loadRelationCountAndMap('club.membersCount', 'club.users')
      .getMany();
  }

  /**
   * Find a club by ID
   */
  async findById(id: string): Promise<Club | null> {
    return this.clubRepository.findOne({
      where: { id },
      relations: ['users'],
    });
  }

  /**
   * Find a club by ID or throw if not found
   */
  async findByIdOrFail(id: string): Promise<Club> {
    const club = await this.findById(id);
    if (!club) {
      throw new NotFoundException(`Club with ID ${id} not found`);
    }
    return club;
  }

  /**
   * Update a club
   */
  async update(id: string, data: Partial<Club>): Promise<Club> {
    const club = await this.findByIdOrFail(id);
    Object.assign(club, data);
    return this.clubRepository.save(club);
  }

  /**
   * Delete a club
   */
  async delete(id: string): Promise<void> {
    const club = await this.findByIdOrFail(id);
    await this.clubRepository.remove(club);
  }

  /**
   * Add a member (user) to a club.
   * Creates a new user with a placeholder auth0Id and assigns them to the club with the given role.
   */
  async addMember(clubId: string, dto: AddMemberDto): Promise<User> {
    await this.findByIdOrFail(clubId);
    const user = await this.userService.createWithoutAuth0({
      clubId,
      roles: [dto.role],
      firstName: dto.firstName,
      lastName: dto.lastName,
      email: dto.email ?? null,
      gender: dto.gender,
      dateOfBirth: dto.dateOfBirth,
      weight: dto.weight ?? null,
      beltLevel: dto.beltLevel,
    });
    const withRelations = await this.userService.findById(user.id);
    if (!withRelations) {
      throw new NotFoundException(`User ${user.id} not found after creation`);
    }
    return withRelations;
  }

  /**
   * Get members (users) of a club. When role is provided, only members with that role are returned (filtered in DB).
   */
  async getMembers(clubId: string, role?: UserRole | null): Promise<User[]> {
    await this.findByIdOrFail(clubId);

    if (role != null) {
      return this.userRepository
        .createQueryBuilder('user')
        .where('user.clubId = :clubId', { clubId })
        .andWhere('user.roles @> ARRAY[:role]::"users_roles_enum"[]', { role })
        .leftJoinAndSelect('user.club', 'club')
        .getMany();
    }

    return this.userRepository.find({
      where: { clubId },
      relations: ['club'],
    });
  }

  /**
   * Get tournaments assigned to a club
   */
  async getTournaments(clubId: string): Promise<Tournament[]> {
    await this.findByIdOrFail(clubId);
    return this.tournamentRepository.find({
      where: { clubId },
      relations: ['createdByUser', 'categoryAssignments', 'categoryAssignments.category', 'club'],
      order: {
        startDate: 'ASC',
        createdAt: 'DESC',
        categoryAssignments: {
          sortOrder: 'ASC',
        },
      },
    });
  }
}
