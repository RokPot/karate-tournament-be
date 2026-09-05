import { randomUUID } from 'crypto';

import { Injectable, NotFoundException, BadRequestException, ForbiddenException, ConflictException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { isAdmin, isClubStaff } from '~common/auth';
import { InvitationStatus, UserRole } from '~common/enums';

import { Club } from '../club/club.entity';
import { User } from '../user/user.entity';

import { InvitationConfig } from './invitation.config';
import { Invitation } from './invitation.entity';

/** Default invitation validity in days */
const INVITATION_EXPIRY_DAYS = 7;

/**
 * Invitation Service
 * Handles invitation creation (from club create), lookup by token, and accept.
 */
@Injectable()
export class InvitationService {
  private readonly logger = new Logger(InvitationService.name);

  constructor(
    @InjectRepository(Invitation)
    private readonly invitationRepository: Repository<Invitation>,
    @InjectRepository(Club)
    private readonly clubRepository: Repository<Club>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly invitationConfig: InvitationConfig,
  ) {}

  /**
   * Find invitations for GET /invitations, scoped by caller role and optional clubId.
   */
  async findAll(user: User, clubId?: string): Promise<Invitation[]> {
    const roles = user.roles ?? [];
    const isAdmin = roles.includes(UserRole.ADMIN);
    const isClubStaff = roles.includes(UserRole.CLUB_OWNER) || roles.includes(UserRole.CLUB_COACH);

    if (isAdmin) {
      return this.invitationRepository.find({
        where: clubId ? { clubId } : {},
        relations: ['club'],
        order: { createdAt: 'DESC' },
      });
    }

    if (isClubStaff) {
      if (!user.clubId) {
        throw new ForbiddenException('User is not associated with a club');
      }
      if (clubId && clubId !== user.clubId) {
        throw new ForbiddenException('Cannot list invitations for another club');
      }

      return this.invitationRepository.find({
        where: { clubId: user.clubId },
        relations: ['club'],
        order: { createdAt: 'DESC' },
      });
    }

    throw new ForbiddenException('Insufficient permissions to list invitations');
  }

  /**
   * Create an invitation for a club.
   * Called when creating a club with ownerEmail (defaults to club_owner).
   * Returns the token for building inviteUrl.
   */
  async create(
    clubId: string,
    email: string,
    firstName?: string | null,
    lastName?: string | null,
    role: UserRole = UserRole.CLUB_OWNER,
  ): Promise<{ token: string; inviteUrl: string }> {
    const token = randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + INVITATION_EXPIRY_DAYS);

    const invitation = this.invitationRepository.create({
      clubId,
      email: email.trim().toLowerCase(),
      firstName: firstName?.trim() || null,
      lastName: lastName?.trim() || null,
      role,
      token,
      expiresAt,
      status: InvitationStatus.PENDING,
    });

    await this.invitationRepository.save(invitation);
    this.logger.log(`Created invitation for club ${clubId}, email ${email}`);

    const baseUrl = this.invitationConfig.frontendBaseUrl.replace(/\/$/, '');
    const inviteUrl = `${baseUrl}/invite/${token}`;

    return { token, inviteUrl };
  }

  /**
   * Invite someone to an existing club. 409 if pending invite or existing member.
   */
  async createForExistingClub(
    clubId: string,
    email: string,
    firstName?: string | null,
    lastName?: string | null,
    role: UserRole = UserRole.CLUB_MEMBER,
  ): Promise<{ invitation: Invitation; inviteUrl: string }> {
    const club = await this.clubRepository.findOne({ where: { id: clubId } });
    if (!club) {
      throw new NotFoundException(`Club with ID ${clubId} not found`);
    }

    const normalizedEmail = email.trim().toLowerCase();

    const pending = await this.invitationRepository.findOne({
      where: { clubId, email: normalizedEmail, status: InvitationStatus.PENDING },
    });
    if (pending) {
      throw new ConflictException('A pending invitation already exists for this email and club');
    }

    const existingMember = await this.userRepository
      .createQueryBuilder('user')
      .where('user.clubId = :clubId', { clubId })
      .andWhere('LOWER(user.email) = :email', { email: normalizedEmail })
      .getOne();
    if (existingMember) {
      throw new ConflictException('This email is already a member of the club');
    }

    const { token, inviteUrl } = await this.create(clubId, normalizedEmail, firstName, lastName, role);
    const invitation = await this.invitationRepository.findOne({
      where: { token },
      relations: ['club'],
    });
    if (!invitation) {
      throw new NotFoundException('Invitation not found after creation');
    }

    return { invitation, inviteUrl };
  }

  /**
   * Cancel a pending invitation.
   */
  async cancel(id: string, user: User): Promise<void> {
    const invitation = await this.invitationRepository.findOne({
      where: { id },
      relations: ['club'],
    });
    if (!invitation) {
      throw new NotFoundException(`Invitation with ID ${id} not found`);
    }

    if (!isAdmin(user.roles)) {
      if (!isClubStaff(user.roles) || !user.clubId || user.clubId !== invitation.clubId) {
        throw new ForbiddenException('Cannot cancel an invitation for another club');
      }
    }

    if (invitation.status !== InvitationStatus.PENDING) {
      throw new BadRequestException('Only pending invitations can be cancelled');
    }

    invitation.status = InvitationStatus.CANCELLED;
    await this.invitationRepository.save(invitation);
    this.logger.log(`Invitation ${invitation.id} cancelled by user ${user.id}`);
  }

  /**
   * Find invitation by token (for public GET by-token).
   * Returns the row if the token exists, including expired / accepted / cancelled.
   */
  async findByToken(token: string): Promise<Invitation | null> {
    return this.invitationRepository.findOne({
      where: { token },
      relations: ['club'],
    });
  }

  /**
   * Find a pending, unexpired invitation by token or throw.
   */
  async findPendingByTokenOrFail(token: string): Promise<Invitation> {
    const invitation = await this.findByToken(token);
    if (!invitation) {
      throw new NotFoundException('Invitation not found or no longer valid');
    }
    if (invitation.status !== InvitationStatus.PENDING || new Date() > invitation.expiresAt) {
      throw new NotFoundException('Invitation not found or no longer valid');
    }
    return invitation;
  }

  /**
   * Accept an invitation: copy empty profile fields, link club, assign invitation role.
   */
  async accept(token: string, user: User): Promise<{ user: User; club: Club }> {
    const invitation = await this.findPendingByTokenOrFail(token);

    const club = await this.clubRepository.findOne({
      where: { id: invitation.clubId },
    });

    if (!club) {
      throw new NotFoundException(`Club ${invitation.clubId} not found`);
    }

    const existingRoles = user.roles ?? [];
    const roleToAdd = invitation.role;
    const patch: Partial<User> = {
      clubId: invitation.clubId,
    };
    if (!existingRoles.includes(roleToAdd)) {
      patch.roles = [...existingRoles, roleToAdd];
    }
    if (!user.firstName && invitation.firstName) patch.firstName = invitation.firstName;
    if (!user.lastName && invitation.lastName) patch.lastName = invitation.lastName;
    if (!user.email && invitation.email) patch.email = invitation.email;

    await this.userRepository.update(user.id, patch);

    await this.invitationRepository.update(invitation.id, {
      status: InvitationStatus.ACCEPTED,
      acceptedAt: new Date(),
      acceptedByUserId: user.id,
    });

    const updatedUser = await this.userRepository.findOne({
      where: { id: user.id },
      relations: ['club'],
    });
    if (!updatedUser) {
      throw new BadRequestException('User not found after update');
    }

    this.logger.log(`Invitation ${invitation.id} accepted by user ${user.id} for club ${invitation.clubId}`);

    return { user: updatedUser, club };
  }
}
