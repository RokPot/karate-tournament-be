import { randomUUID } from 'crypto';

import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

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
   * Find all invitations (for GET /invitations list), newest first.
   */
  async findAll(): Promise<Invitation[]> {
    return this.invitationRepository.find({
      relations: ['club'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Create an invitation for a club owner.
   * Called when creating a club with ownerEmail.
   * Returns the token for building inviteUrl.
   */
  async create(
    clubId: string,
    email: string,
    firstName?: string | null,
    lastName?: string | null,
  ): Promise<{ token: string; inviteUrl: string }> {
    const token = randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + INVITATION_EXPIRY_DAYS);

    const invitation = this.invitationRepository.create({
      clubId,
      email: email.trim().toLowerCase(),
      firstName: firstName?.trim() || null,
      lastName: lastName?.trim() || null,
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
   * Find invitation by token (for public GET by-token).
   * Returns invitation with club relation or null if not found / expired / not pending.
   */
  async findByToken(token: string): Promise<Invitation | null> {
    const invitation = await this.invitationRepository.findOne({
      where: { token },
      relations: ['club'],
    });

    if (!invitation) {
      return null;
    }

    if (invitation.status !== InvitationStatus.PENDING) {
      return null;
    }

    if (new Date() > invitation.expiresAt) {
      return null;
    }

    return invitation;
  }

  /**
   * Find invitation by token or throw if not found / not valid.
   */
  async findByTokenOrFail(token: string): Promise<Invitation> {
    const invitation = await this.findByToken(token);
    if (!invitation) {
      throw new NotFoundException('Invitation not found or no longer valid');
    }
    return invitation;
  }

  /**
   * Accept an invitation: link user to club, assign club owner role, mark invitation accepted.
   */
  async accept(token: string, user: User): Promise<{ user: User; club: Club }> {
    const invitation = await this.findByTokenOrFail(token);

    const club = await this.clubRepository.findOne({
      where: { id: invitation.clubId },
    });

    if (!club) {
      throw new NotFoundException(`Club ${invitation.clubId} not found`);
    }

    const existingRoles = user.roles ?? [];
    const roleToAdd = UserRole.CLUB_OWNER;
    if (!existingRoles.includes(roleToAdd)) {
      await this.userRepository.update(user.id, {
        clubId: invitation.clubId,
        roles: [...existingRoles, roleToAdd],
      });
    } else {
      await this.userRepository.update(user.id, {
        clubId: invitation.clubId,
      });
    }

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
