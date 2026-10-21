import { randomBytes, randomInt } from 'crypto';

import {
  BadRequestException,
  ConflictException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, IsNull, Repository } from 'typeorm';

import { isTeamDiscipline, TeamRole, UserRole } from '~common/enums';
import { MailService } from '~common/mail';
import { formatDateOfBirthForResponse, parseDateOfBirth } from '~common/utils/date-only.utils';
import { sha256Hex, sha256HexEqual } from '~common/utils/sha256';

import { Club } from '../club/club.entity';
import { TournamentFeesCalculationDto } from '../tournament/dto/tournament-fees-calculation.dto';
import { Tournament } from '../tournament/tournament.entity';
import { User } from '../user/user.entity';

import { RosterIdentityDto } from './dto/roster-identity.dto';
import { RosterOtpVerifyDto } from './dto/roster-otp.dto';
import { RosterPutDto } from './dto/roster-put.dto';
import { RosterParticipantDto, RosterResponseDto, RosterTeamItemDto } from './dto/roster-response.dto';
import { RegistrationRosterOtp } from './registration-roster-otp.entity';
import { RegistrationRosterSession } from './registration-roster-session.entity';
import { RegistrationSubmission } from './registration-submission.entity';
import { Registration } from './registration.entity';
import { RegistrationService } from './registration.service';
import {
  clubMatchesRoster,
  latestSubmission,
  normalizeRosterEmail,
  oldestSubmission,
  type RosterIdentity,
  submissionMatchesRosterEmail,
} from './roster-identity';
import { TeamMember } from './team-member.entity';
import { resolveTeamName, teamNameScopeKey } from './team-name';
import { Team } from './team.entity';

const OTP_TTL_MS = 10 * 60 * 1000;
const OTP_RESEND_MS = 60 * 1000;
const OTP_MAX_ATTEMPTS = 5;
const SESSION_TTL_MS = 2 * 60 * 60 * 1000;
const REGISTRATION_RELATIONS = ['user', 'category', 'teamMembers', 'teamMembers.team'] as const;

@Injectable()
export class RegistrationRosterService {
  private readonly logger = new Logger(RegistrationRosterService.name);

  constructor(
    @InjectRepository(RegistrationSubmission)
    private readonly submissionRepository: Repository<RegistrationSubmission>,
    @InjectRepository(Registration)
    private readonly registrationRepository: Repository<Registration>,
    @InjectRepository(RegistrationRosterOtp)
    private readonly otpRepository: Repository<RegistrationRosterOtp>,
    @InjectRepository(RegistrationRosterSession)
    private readonly sessionRepository: Repository<RegistrationRosterSession>,
    @InjectRepository(Tournament)
    private readonly tournamentRepository: Repository<Tournament>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Team)
    private readonly teamRepository: Repository<Team>,
    @InjectRepository(TeamMember)
    private readonly teamMemberRepository: Repository<TeamMember>,
    private readonly registrationService: RegistrationService,
    private readonly mailService: MailService,
  ) {}

  async lookup(dto: RosterIdentityDto): Promise<{ found: boolean; updatedAt: string | null }> {
    const identity = await this.resolveIdentity(dto);
    const submissions = await this.findMatchingSubmissions(identity);
    if (submissions.length === 0) {
      return { found: false, updatedAt: null };
    }
    return { found: true, updatedAt: this.toIso(latestSubmission(submissions).updatedAt) };
  }

  async requestOtp(dto: RosterIdentityDto): Promise<{ debugCode?: string }> {
    const identity = await this.resolveIdentity(dto);
    const submissions = await this.findMatchingSubmissions(identity);
    if (submissions.length === 0) {
      throw new NotFoundException('No registration roster found for this email and club');
    }

    const recent = await this.findActiveOtp(identity);
    if (recent && Date.now() - recent.createdAt.getTime() < OTP_RESEND_MS) {
      throw new HttpException('Wait before requesting another code', HttpStatus.TOO_MANY_REQUESTS);
    }

    if (recent) {
      recent.consumedAt = new Date();
      await this.otpRepository.save(recent);
    }

    const code = String(randomInt(0, 1_000_000)).padStart(6, '0');
    const otp = this.otpRepository.create({
      tournamentId: identity.tournamentId,
      email: identity.email,
      clubId: identity.clubId,
      clubName: identity.clubName,
      codeHash: sha256Hex(code),
      expiresAt: new Date(Date.now() + OTP_TTL_MS),
      consumedAt: null,
      attemptCount: 0,
    });
    await this.otpRepository.save(otp);

    const tournament = await this.tournamentRepository.findOne({ where: { id: identity.tournamentId } });
    const latest = latestSubmission(submissions);
    await this.mailService.sendRosterOtp({
      to: identity.email,
      tournamentName: tournament?.name ?? 'Tournament',
      code,
      firstName: latest.firstName,
      clubName: identity.clubName ?? latest.clubName,
      expiresInMinutes: Math.round(OTP_TTL_MS / 60_000),
    });

    if (this.mailService.isDebugOtpAllowed()) {
      return { debugCode: code };
    }
    return {};
  }

  async verifyOtp(dto: RosterOtpVerifyDto): Promise<{ accessToken: string; expiresAt: string; updatedAt: string }> {
    const identity = await this.resolveIdentity(dto);
    const submissions = await this.findMatchingSubmissions(identity);
    if (submissions.length === 0) {
      throw new NotFoundException('No registration roster found for this email and club');
    }

    const otp = await this.findActiveOtp(identity);
    if (!otp || otp.expiresAt.getTime() <= Date.now()) {
      throw new BadRequestException('Invalid or expired code');
    }

    if (!sha256HexEqual(otp.codeHash, sha256Hex(dto.code))) {
      otp.attemptCount += 1;
      if (otp.attemptCount >= OTP_MAX_ATTEMPTS) {
        otp.consumedAt = new Date();
      }
      await this.otpRepository.save(otp);
      throw new BadRequestException('Invalid or expired code');
    }

    otp.consumedAt = new Date();
    await this.otpRepository.save(otp);

    const accessToken = randomBytes(32).toString('base64url');
    const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
    await this.sessionRepository.save(
      this.sessionRepository.create({
        tokenHash: sha256Hex(accessToken),
        tournamentId: identity.tournamentId,
        email: identity.email,
        clubId: identity.clubId,
        clubName: identity.clubName,
        expiresAt,
      }),
    );

    return {
      accessToken,
      expiresAt: this.toIso(expiresAt),
      updatedAt: this.toIso(latestSubmission(submissions).updatedAt),
    };
  }

  async getCurrent(accessToken: string): Promise<RosterResponseDto> {
    const identity = await this.requireSession(accessToken);
    return this.buildRosterResponse(identity);
  }

  async putCurrent(dto: RosterPutDto): Promise<RosterResponseDto> {
    const identity = await this.requireSession(dto.accessToken);
    if (dto.tournamentId !== identity.tournamentId) {
      throw new BadRequestException('Tournament does not match this roster');
    }
    if (normalizeRosterEmail(dto.email) !== identity.email) {
      throw new BadRequestException('Email does not match this roster');
    }

    const tournament = await this.tournamentRepository.findOne({
      where: { id: identity.tournamentId },
      relations: ['categoryAssignments', 'categoryAssignments.category'],
    });
    if (!tournament) {
      throw new NotFoundException(`Tournament with ID ${identity.tournamentId} not found`);
    }
    this.registrationService.assertTournamentOpenForRegistration(tournament, 'not_found');

    const submissions = await this.findMatchingSubmissions(identity);
    if (submissions.length === 0) {
      throw new NotFoundException('No registration roster found for this email and club');
    }
    const latest = latestSubmission(submissions);
    if (new Date(dto.updatedAt).getTime() !== latest.updatedAt.getTime()) {
      throw new ConflictException('Roster was updated; reload and try again');
    }
    const canonical = oldestSubmission(submissions);

    const tournamentCategories = (tournament.categoryAssignments ?? []).map((assignment) => assignment.category);
    await this.registrationService.validateTeamsPayload(dto, tournamentCategories, tournament.startDate);

    const rosterRegs = await this.registrationsForSubmissionIds(submissions.map((submission) => submission.id));
    const rosterUserIds = new Set(rosterRegs.map((registration) => registration.userId));

    const participantUsers: User[] = [];
    for (const participant of dto.participants) {
      let user: User;
      if (participant.userId) {
        if (!rosterUserIds.has(participant.userId)) {
          throw new BadRequestException(`Participant ${participant.userId} is not on this roster`);
        }
        user = await this.patchRosterUser(participant.userId, participant);
      } else {
        user = await this.registrationService.findOrCreateBulkParticipant({
          firstName: participant.firstName,
          lastName: participant.lastName,
          clubName: identity.clubName ?? undefined,
          clubId: identity.clubId,
          weight: participant.weight,
          dateOfBirth: participant.dateOfBirth,
          gender: participant.gender,
          beltLevel: participant.beltLevel,
          rolesToAdd: [UserRole.CLUB_MEMBER],
        });
      }
      participantUsers.push(user);
      rosterUserIds.add(user.id);
    }

    const desired = this.desiredRegistrationKeys(dto, participantUsers);
    const teamRosterKeys = new Set<string>();
    for (const team of dto.teams ?? []) {
      for (const participantIndex of [...team.starters, ...(team.reserves ?? [])]) {
        const user = participantUsers[participantIndex];
        if (user) {
          teamRosterKeys.add(`${user.id}:${team.categoryId}`);
        }
      }
    }

    for (const registration of rosterRegs) {
      const key = `${registration.userId}:${registration.categoryId}`;
      if (!desired.has(key)) {
        await this.registrationRepository.delete(registration.id);
      }
    }

    for (const item of desired.values()) {
      const existing = await this.registrationRepository.findOne({
        where: {
          userId: item.user.id,
          tournamentId: identity.tournamentId,
          categoryId: item.categoryId,
        },
      });
      if (existing) {
        if (existing.submissionId !== canonical.id) {
          existing.submissionId = canonical.id;
          await this.registrationRepository.save(existing);
        }
        continue;
      }
      await this.registrationService.createRegistrationForUser(item.user, {
        tournamentId: identity.tournamentId,
        categoryId: item.categoryId,
        clubId: identity.clubId,
        finalWeight: item.finalWeight,
        submissionId: canonical.id,
        unapprovedAs: 'not_found',
        ...(teamRosterKeys.has(`${item.user.id}:${item.categoryId}`) ? { eligibility: 'team-roster' as const } : {}),
      });
    }

    await this.syncTeams(identity, dto, participantUsers, canonical.id, rosterRegs);
    await this.collapseRosterSubmissions(canonical, submissions);

    await this.submissionRepository.query(
      `UPDATE "registration_submissions" SET "firstName" = $1, "lastName" = $2, "updatedAt" = NOW() WHERE id = $3`,
      [dto.firstName.trim(), dto.lastName.trim(), canonical.id],
    );

    await this.queueUpdatedRegistrationEmail(identity, dto, tournament, canonical.id);
    return this.buildRosterResponse(identity);
  }

  private desiredRegistrationKeys(
    dto: RosterPutDto,
    participantUsers: User[],
  ): Map<string, { user: User; categoryId: string; finalWeight?: number }> {
    const desired = new Map<string, { user: User; categoryId: string; finalWeight?: number }>();
    dto.participants.forEach((participant, participantIndex) => {
      const user = participantUsers[participantIndex];
      for (const registration of participant.registrations ?? []) {
        desired.set(`${user.id}:${registration.categoryId}`, {
          user,
          categoryId: registration.categoryId,
          finalWeight: registration.finalWeight,
        });
      }
    });
    for (const team of dto.teams ?? []) {
      for (const participantIndex of [...team.starters, ...(team.reserves ?? [])]) {
        const user = participantUsers[participantIndex];
        desired.set(`${user.id}:${team.categoryId}`, { user, categoryId: team.categoryId });
      }
    }
    return desired;
  }

  private async syncTeams(
    identity: RosterIdentity,
    dto: RosterPutDto,
    participantUsers: User[],
    submissionId: string,
    previousRegs: Registration[],
  ): Promise<void> {
    const previousTeamIds = new Set<string>();
    for (const registration of previousRegs) {
      if (registration.teamId) {
        previousTeamIds.add(registration.teamId);
      }
      for (const member of registration.teamMembers ?? []) {
        previousTeamIds.add(member.teamId);
      }
    }

    const payloadTeams = dto.teams ?? [];
    const keptIds = new Set(payloadTeams.map((team) => team.id).filter((id): id is string => !!id));
    for (const teamId of keptIds) {
      if (!previousTeamIds.has(teamId)) {
        throw new BadRequestException(`Team ${teamId} is not on this roster`);
      }
    }

    for (const teamId of previousTeamIds) {
      if (keptIds.has(teamId)) {
        continue;
      }
      await this.registrationRepository.update({ teamId }, { teamId: null, teamRole: null });
      await this.teamRepository.delete(teamId);
    }

    const existingTeams = await this.teamRepository.find({
      where: { tournamentId: identity.tournamentId },
      select: ['id', 'categoryId', 'clubId', 'name'],
    });
    const takenByScope = new Map<string, string[]>();
    for (const existing of existingTeams) {
      if (previousTeamIds.has(existing.id) && !keptIds.has(existing.id)) {
        continue;
      }
      const scopeKey = teamNameScopeKey(existing.categoryId, existing.clubId);
      const names = takenByScope.get(scopeKey) ?? [];
      names.push(existing.name);
      takenByScope.set(scopeKey, names);
    }

    for (const teamDto of payloadTeams) {
      let team: Team;
      if (teamDto.id) {
        const found = await this.teamRepository.findOne({ where: { id: teamDto.id } });
        if (!found) {
          throw new BadRequestException(`Team ${teamDto.id} not found`);
        }
        if (teamDto.name?.trim()) {
          found.name = teamDto.name.trim();
          await this.teamRepository.save(found);
        }
        await this.teamMemberRepository.delete({ teamId: found.id });
        team = found;
      } else {
        const scopeKey = teamNameScopeKey(teamDto.categoryId, identity.clubId);
        const taken = takenByScope.get(scopeKey) ?? [];
        const name = resolveTeamName({
          provided: teamDto.name,
          clubName: identity.clubName,
          starterLastNames: teamDto.starters.map((index) => participantUsers[index]?.lastName),
          taken,
        });
        taken.push(name);
        takenByScope.set(scopeKey, taken);
        team = await this.teamRepository.save(
          this.teamRepository.create({
            tournamentId: identity.tournamentId,
            categoryId: teamDto.categoryId,
            clubId: identity.clubId,
            name,
          }),
        );
      }

      const members: Array<{ participantIndex: number; role: TeamRole }> = [
        ...teamDto.starters.map((participantIndex) => ({ participantIndex, role: TeamRole.STARTER })),
        ...(teamDto.reserves ?? []).map((participantIndex) => ({ participantIndex, role: TeamRole.RESERVE })),
      ];
      for (const { participantIndex, role } of members) {
        const user = participantUsers[participantIndex];
        await this.registrationService.createOrAttachTeamRegistration(user, {
          tournamentId: identity.tournamentId,
          categoryId: teamDto.categoryId,
          clubId: identity.clubId,
          teamId: team.id,
          teamRole: role,
          submissionId,
          unapprovedAs: 'not_found',
        });
      }
    }
  }

  private async queueUpdatedRegistrationEmail(
    identity: RosterIdentity,
    dto: RosterPutDto,
    tournament: Tournament,
    canonicalSubmissionId: string,
  ): Promise<void> {
    if (!isDeliverableEmail(identity.email)) {
      return;
    }

    const registrations = await this.registrationsForSubmissionIds([canonicalSubmissionId]);
    if (registrations.length === 0) {
      return;
    }

    const calculation = this.registrationService.feesForRegistrations(tournament, registrations);
    await this.mailService.sendRegistrationUpdated({
      to: identity.email,
      recipientName: dto.firstName.trim() || 'there',
      tournamentName: tournament.name?.trim() || 'Tournament',
      clubName: identity.clubName ?? dto.clubName,
      registrations: registrations.map((registration) => ({
        participantName: participantDisplayName(registration.user),
        tournamentName: tournament.name?.trim() || 'Tournament',
        categoryName: registration.category?.name?.trim() || 'Category',
        clubName: identity.clubName,
      })),
      fees: {
        participants: calculation.participants.map((row) => ({
          name: row.name,
          categoryCount: row.categoryCount,
          amount: row.amount,
        })),
        teams: calculation.teams.map((row) => ({
          name: `${row.name} (${row.categoryName})`,
          amount: row.amount,
        })),
        total: calculation.total,
      },
    });
  }

  private async collapseRosterSubmissions(
    canonical: RegistrationSubmission,
    submissions: RegistrationSubmission[],
  ): Promise<void> {
    const matchingIds = submissions.map((submission) => submission.id);
    const siblingIds = matchingIds.filter((id) => id !== canonical.id);
    if (matchingIds.length > 0) {
      await this.registrationRepository.query(
        `UPDATE "registrations" SET "submissionId" = $1, "updatedAt" = NOW() WHERE "submissionId" = ANY($2::uuid[])`,
        [canonical.id, matchingIds],
      );
    }
    if (siblingIds.length === 0) {
      return;
    }
    await this.submissionRepository.query(`DELETE FROM "registration_submissions" WHERE id = ANY($1::uuid[])`, [
      siblingIds,
    ]);
  }

  private async patchRosterUser(userId: string, participant: RosterPutDto['participants'][number]): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }
    user.firstName = participant.firstName;
    user.lastName = participant.lastName;
    user.weight = participant.weight ?? null;
    user.dateOfBirth = parseDateOfBirth(participant.dateOfBirth);
    user.gender = participant.gender ?? null;
    user.beltLevel = participant.beltLevel ?? null;
    return this.userRepository.save(user);
  }

  private async buildRosterResponse(identity: RosterIdentity): Promise<RosterResponseDto> {
    const submissions = await this.findMatchingSubmissions(identity);
    if (submissions.length === 0) {
      throw new NotFoundException('No registration roster found for this email and club');
    }
    const latest = latestSubmission(submissions);
    const tournament = await this.tournamentRepository.findOne({ where: { id: identity.tournamentId } });
    if (!tournament) {
      throw new NotFoundException(`Tournament with ID ${identity.tournamentId} not found`);
    }

    const registrations = await this.registrationsForSubmissionIds(submissions.map((submission) => submission.id));
    const participants = this.mapParticipants(registrations);
    const teams = this.mapTeams(registrations, participants);
    const fees = this.registrationService.feesForRegistrations(tournament, registrations);

    return new RosterResponseDto({
      email: latest.email,
      firstName: latest.firstName,
      lastName: latest.lastName,
      clubName: latest.clubName,
      clubId: latest.clubId,
      tournamentId: identity.tournamentId,
      updatedAt: this.toIso(latest.updatedAt),
      participants,
      teams,
      fees: TournamentFeesCalculationDto.fromCalculation(fees),
    });
  }

  private mapParticipants(registrations: Registration[]): RosterParticipantDto[] {
    const byUser = new Map<string, { user: User; registrations: Registration[] }>();
    for (const registration of registrations) {
      if (!registration.user) {
        continue;
      }
      const existing = byUser.get(registration.userId);
      if (existing) {
        existing.registrations.push(registration);
      } else {
        byUser.set(registration.userId, { user: registration.user, registrations: [registration] });
      }
    }

    return [...byUser.values()]
      .map(({ user, registrations: userRegs }) => {
        const individual = userRegs.filter(
          (registration) => registration.category && !isTeamDiscipline(registration.category.discipline),
        );
        return {
          userId: user.id,
          firstName: user.firstName ?? '',
          lastName: user.lastName ?? '',
          weight: user.weight,
          dateOfBirth: formatDateOfBirthForResponse(user.dateOfBirth) ?? '',
          gender: user.gender,
          beltLevel: user.beltLevel,
          registrations: individual.map((registration) => ({
            id: registration.id,
            categoryId: registration.categoryId,
          })),
        };
      })
      .sort(
        (a, b) =>
          a.lastName.localeCompare(b.lastName) ||
          a.firstName.localeCompare(b.firstName) ||
          a.userId.localeCompare(b.userId),
      );
  }

  private mapTeams(registrations: Registration[], participants: RosterParticipantDto[]): RosterTeamItemDto[] {
    const indexByUserId = new Map(participants.map((participant, index) => [participant.userId, index]));
    const teams = new Map<string, Team>();
    const membersByTeam = new Map<string, Array<{ userId: string; role: TeamRole }>>();

    for (const registration of registrations) {
      for (const member of registration.teamMembers ?? []) {
        const team = member.team;
        if (!team) {
          continue;
        }
        teams.set(team.id, team);
        const members = membersByTeam.get(team.id) ?? [];
        members.push({ userId: registration.userId, role: member.role });
        membersByTeam.set(team.id, members);
      }
    }

    return [...teams.values()]
      .sort((a, b) => a.name.localeCompare(b.name) || a.id.localeCompare(b.id))
      .map((team) => {
        const members = membersByTeam.get(team.id) ?? [];
        const starters = members
          .filter((member) => member.role === TeamRole.STARTER)
          .map((member) => indexByUserId.get(member.userId))
          .filter((index): index is number => index != null);
        const reserves = members
          .filter((member) => member.role === TeamRole.RESERVE)
          .map((member) => indexByUserId.get(member.userId))
          .filter((index): index is number => index != null);
        return {
          id: team.id,
          name: team.name,
          categoryId: team.categoryId,
          starters,
          ...(reserves.length > 0 ? { reserves } : {}),
        };
      });
  }

  private async registrationsForSubmissionIds(submissionIds: string[]): Promise<Registration[]> {
    if (submissionIds.length === 0) {
      return [];
    }
    return this.registrationRepository.find({
      where: { submissionId: In(submissionIds) },
      relations: [...REGISTRATION_RELATIONS],
    });
  }

  private async resolveIdentity(dto: RosterIdentityDto): Promise<RosterIdentity> {
    const tournament = await this.tournamentRepository.findOne({ where: { id: dto.tournamentId } });
    if (!tournament) {
      throw new NotFoundException(`Tournament with ID ${dto.tournamentId} not found`);
    }
    const clubName = dto.clubName?.trim() || null;
    const club: Club | null = clubName ? await this.registrationService.resolveClubByName(clubName) : null;
    return {
      tournamentId: dto.tournamentId,
      email: normalizeRosterEmail(dto.email),
      clubId: club?.id ?? null,
      clubName,
    };
  }

  private async findMatchingSubmissions(identity: RosterIdentity): Promise<RegistrationSubmission[]> {
    const coach = await this.userRepository
      .createQueryBuilder('user')
      .where('LOWER(user.email) = :email', { email: identity.email })
      .getOne();

    const submissions = await this.submissionRepository.find({
      where: { tournamentId: identity.tournamentId },
    });

    return submissions.filter(
      (submission) =>
        submissionMatchesRosterEmail(submission, identity.email, coach?.id ?? null) &&
        clubMatchesRoster(submission, identity.clubId, identity.clubName),
    );
  }

  private async findActiveOtp(identity: RosterIdentity): Promise<RegistrationRosterOtp | null> {
    const where = {
      tournamentId: identity.tournamentId,
      email: identity.email,
      consumedAt: IsNull(),
      ...(identity.clubId ? { clubId: identity.clubId } : { clubId: IsNull() }),
    };
    const rows = await this.otpRepository.find({
      where,
      order: { createdAt: 'DESC' },
    });
    return (
      rows.find((row) => {
        if (identity.clubId) {
          return true;
        }
        return (row.clubName?.trim().toLowerCase() ?? '') === (identity.clubName?.trim().toLowerCase() ?? '');
      }) ?? null
    );
  }

  private async requireSession(accessToken: string): Promise<RosterIdentity> {
    const tokenHash = sha256Hex(accessToken.trim());
    const session = await this.sessionRepository.findOne({ where: { tokenHash } });
    if (!session || session.expiresAt.getTime() <= Date.now()) {
      throw new UnauthorizedException('Invalid or expired access token');
    }
    return {
      tournamentId: session.tournamentId,
      email: session.email,
      clubId: session.clubId,
      clubName: session.clubName,
    };
  }

  private toIso(value: Date): string {
    return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
  }
}

const BULK_PARTICIPANT_EMAIL_SUFFIX = '@bulk.participant.local';

function isDeliverableEmail(email: string): boolean {
  const normalized = email.trim().toLowerCase();
  return normalized.length > 0 && !normalized.endsWith(BULK_PARTICIPANT_EMAIL_SUFFIX);
}

function participantDisplayName(user: User | null | undefined): string {
  const parts = [user?.firstName, user?.lastName].filter((part): part is string => Boolean(part?.trim()));
  if (parts.length > 0) {
    return parts.join(' ');
  }
  return user?.email?.trim() || 'Participant';
}
