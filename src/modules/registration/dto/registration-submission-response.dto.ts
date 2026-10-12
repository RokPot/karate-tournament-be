import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';

import { BeltLevel, Gender } from '~common/enums';
import { ApiDateTimeProperty, ApiDateTimePropertyOptional } from '~common/swagger/api-date.decorators';
import { formatDateOfBirthForResponse } from '~common/utils/date-only.utils';

import { CategoryResponseDto } from '../../category/dto/category-response.dto';
import type { TournamentFeeCalculation } from '../../tournament/calculate-tournament-fees';
import { TournamentFeesCalculationDto } from '../../tournament/dto/tournament-fees-calculation.dto';
import { User } from '../../user/user.entity';
import { RegistrationSubmission } from '../registration-submission.entity';
import { Registration } from '../registration.entity';

export class RegistrationSubmissionDetailsDto {
  @Expose()
  @ApiProperty({ description: 'Submission ID', example: '123e4567-e89b-12d3-a456-426614174000' })
  id!: string;

  @Expose()
  @ApiProperty({ description: 'Tournament ID', example: '123e4567-e89b-12d3-a456-426614174000' })
  tournamentId!: string;

  @Expose()
  @ApiProperty({ description: 'Contact email from the Club and contact form', example: 'coach@club.com' })
  email!: string;

  @Expose()
  @ApiProperty({ description: 'Contact first name', example: 'Jane' })
  firstName!: string;

  @Expose()
  @ApiProperty({ description: 'Contact last name', example: 'Coach' })
  lastName!: string;

  @Expose()
  @ApiPropertyOptional({
    description: 'Club name as typed on the form (kept even when no matching club exists)',
    example: 'Test 123',
    nullable: true,
  })
  clubName!: string | null;

  @Expose()
  @ApiPropertyOptional({
    description: 'Resolved club ID when a matching club exists',
    example: '123e4567-e89b-12d3-a456-426614174000',
    nullable: true,
  })
  clubId!: string | null;

  @Expose()
  @ApiPropertyOptional({
    description: 'Coach / contact user ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
    nullable: true,
  })
  registeredByUserId!: string | null;

  @Expose()
  @ApiDateTimeProperty({ description: 'When this submit was created' })
  createdAt!: string;

  constructor(data: RegistrationSubmissionDetailsDto) {
    Object.assign(this, data);
  }

  static fromDomain(submission: RegistrationSubmission): RegistrationSubmissionDetailsDto {
    return new RegistrationSubmissionDetailsDto({
      id: submission.id,
      tournamentId: submission.tournamentId,
      email: submission.email,
      firstName: submission.firstName,
      lastName: submission.lastName,
      clubName: submission.clubName,
      clubId: submission.clubId,
      registeredByUserId: submission.registeredByUserId,
      createdAt:
        submission.createdAt instanceof Date ? submission.createdAt.toISOString() : String(submission.createdAt || ''),
    });
  }
}

export class RegistrationSubmissionParticipantDto {
  @Expose()
  @ApiProperty({ description: 'Participant user ID', example: '123e4567-e89b-12d3-a456-426614174000' })
  id!: string;

  @Expose()
  @ApiPropertyOptional({ description: 'First name', example: 'John', nullable: true })
  firstName!: string | null;

  @Expose()
  @ApiPropertyOptional({ description: 'Last name', example: 'Doe', nullable: true })
  lastName!: string | null;

  @Expose()
  @ApiPropertyOptional({ description: 'Gender', enum: Gender, example: Gender.MALE, nullable: true })
  gender!: Gender | null;

  @Expose()
  @ApiDateTimePropertyOptional({
    description: 'Date of birth',
    example: '2018-02-02T00:00:00.000Z',
    nullable: true,
  })
  dateOfBirth!: string | null;

  @Expose()
  @ApiPropertyOptional({ description: 'Weight in kg', example: 65, nullable: true })
  weight!: number | null;

  @Expose()
  @ApiPropertyOptional({ description: 'Belt level', enum: BeltLevel, example: BeltLevel.KYU_10, nullable: true })
  beltLevel!: BeltLevel | null;

  @Expose()
  @Type(() => CategoryResponseDto)
  @ApiProperty({
    description: 'Categories this participant was registered into on this submit',
    type: [CategoryResponseDto],
  })
  categories!: CategoryResponseDto[];

  constructor(data: RegistrationSubmissionParticipantDto) {
    Object.assign(this, data);
  }

  static fromUserAndRegistrations(user: User, registrations: Registration[]): RegistrationSubmissionParticipantDto {
    const categories: CategoryResponseDto[] = [];
    const seen = new Set<string>();
    for (const registration of registrations) {
      if (!registration.category || seen.has(registration.categoryId)) {
        continue;
      }
      seen.add(registration.categoryId);
      categories.push(CategoryResponseDto.fromDomain(registration.category));
    }

    return new RegistrationSubmissionParticipantDto({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      gender: user.gender,
      dateOfBirth: formatDateOfBirthForResponse(user.dateOfBirth),
      weight: user.weight != null && typeof user.weight === 'string' ? parseFloat(user.weight) : user.weight,
      beltLevel: user.beltLevel,
      categories,
    });
  }
}

export class RegistrationSubmissionResponseDto {
  @Expose()
  @Type(() => RegistrationSubmissionDetailsDto)
  @ApiProperty({ description: 'Club and contact details from this submit', type: RegistrationSubmissionDetailsDto })
  details!: RegistrationSubmissionDetailsDto;

  @Expose()
  @Type(() => RegistrationSubmissionParticipantDto)
  @ApiProperty({
    description: 'Participants registered on this submit, each with their categories',
    type: [RegistrationSubmissionParticipantDto],
  })
  participants!: RegistrationSubmissionParticipantDto[];

  @Expose()
  @Type(() => TournamentFeesCalculationDto)
  @ApiProperty({
    description: 'Fees due for pending and approved registrations on this submit',
    type: TournamentFeesCalculationDto,
  })
  fees!: TournamentFeesCalculationDto;

  constructor(data: RegistrationSubmissionResponseDto) {
    Object.assign(this, data);
  }

  static fromDomain(
    submission: RegistrationSubmission,
    fees: TournamentFeeCalculation,
  ): RegistrationSubmissionResponseDto {
    const byUser = new Map<string, { user: User; registrations: Registration[] }>();
    for (const registration of submission.registrations ?? []) {
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

    return new RegistrationSubmissionResponseDto({
      details: RegistrationSubmissionDetailsDto.fromDomain(submission),
      participants: Array.from(byUser.values()).map((group) =>
        RegistrationSubmissionParticipantDto.fromUserAndRegistrations(group.user, group.registrations),
      ),
      fees: TournamentFeesCalculationDto.fromCalculation(fees),
    });
  }
}
