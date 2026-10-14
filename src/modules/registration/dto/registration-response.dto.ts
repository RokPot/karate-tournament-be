import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';

import { RegistrationStatus, TeamRole } from '~common/enums';

import { ClubResponseDto } from '../../club/dto/club-response.dto';
import { UserResponseDto } from '../../user/dto/user-response.dto';
import { Registration } from '../registration.entity';

export class TeamMembershipDto {
  @Expose()
  @ApiProperty({
    description: 'Team ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  teamId!: string;

  @Expose()
  @ApiProperty({
    description: 'Role on this team roster',
    enum: TeamRole,
    example: TeamRole.STARTER,
  })
  teamRole!: TeamRole;

  @Expose()
  @ApiPropertyOptional({
    description: 'Team display name',
    example: 'SKIF Ljubljana A',
    nullable: true,
  })
  teamName!: string | null;
}

/**
 * Registration Response DTO
 * Data transfer object for registration responses.
 */
export class RegistrationResponseDto {
  @Expose()
  @ApiProperty({
    description: 'Registration ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id!: string;

  @Expose()
  @ApiProperty({
    description: 'User ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  userId!: string;

  @Expose()
  @ApiPropertyOptional({
    description: 'Club ID (null when no club was linked)',
    example: '123e4567-e89b-12d3-a456-426614174000',
    nullable: true,
  })
  clubId!: string | null;

  @Expose()
  @ApiProperty({
    description: 'Tournament ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  tournamentId!: string;

  @Expose()
  @ApiProperty({
    description: 'Category ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  categoryId!: string;

  @Expose()
  @ApiProperty({
    description: 'Registration status',
    enum: RegistrationStatus,
    example: RegistrationStatus.PENDING,
  })
  status!: RegistrationStatus;

  @Expose()
  @ApiPropertyOptional({
    description: 'Final weight in kg',
    example: 75.5,
    nullable: true,
  })
  finalWeight!: number | null;

  @Expose()
  @ApiPropertyOptional({
    description: 'First team ID when this registration is on one or more team rosters',
    example: '123e4567-e89b-12d3-a456-426614174000',
    nullable: true,
  })
  teamId!: string | null;

  @Expose()
  @ApiPropertyOptional({
    description: 'Role on the first team roster',
    enum: TeamRole,
    example: TeamRole.STARTER,
    nullable: true,
  })
  teamRole!: TeamRole | null;

  @Expose()
  @Type(() => TeamMembershipDto)
  @ApiPropertyOptional({
    description: 'All team roster memberships for this registration (a person may be on overlapping teams)',
    type: [TeamMembershipDto],
  })
  teamMemberships!: TeamMembershipDto[];

  @Expose()
  @Type(() => UserResponseDto)
  @ApiPropertyOptional({
    description: 'User information',
    type: UserResponseDto,
    nullable: true,
  })
  user!: UserResponseDto | null;

  @Expose()
  @Type(() => ClubResponseDto)
  @ApiPropertyOptional({
    description: 'Club information',
    type: ClubResponseDto,
    nullable: true,
  })
  club!: ClubResponseDto | null;

  @Expose()
  @ApiProperty({
    description: 'Creation timestamp',
    example: '2024-01-01T00:00:00.000Z',
    type: String,
    format: 'date-time',
  })
  createdAt!: string;

  @Expose()
  @ApiProperty({
    description: 'Last update timestamp',
    example: '2024-01-01T00:00:00.000Z',
    type: String,
    format: 'date-time',
  })
  updatedAt!: string;

  constructor(data: IRegistrationResponseDto) {
    Object.assign(this, data);
  }

  /**
   * Creates a RegistrationResponseDto instance from a Registration entity
   */
  static fromDomain(registration: Registration): RegistrationResponseDto {
    const teamMemberships =
      registration.teamMembers?.length > 0
        ? registration.teamMembers.map((member) => ({
            teamId: member.teamId,
            teamRole: member.role,
            teamName: member.team?.name ?? null,
          }))
        : registration.teamId && registration.teamRole
          ? [
              {
                teamId: registration.teamId,
                teamRole: registration.teamRole,
                teamName: registration.team?.name ?? null,
              },
            ]
          : [];
    const firstMembership = teamMemberships[0];

    return new RegistrationResponseDto({
      id: registration.id,
      userId: registration.userId,
      clubId: registration.clubId,
      tournamentId: registration.tournamentId,
      categoryId: registration.categoryId,
      status: registration.status,
      finalWeight:
        registration.finalWeight != null && typeof registration.finalWeight === 'string'
          ? parseFloat(registration.finalWeight)
          : registration.finalWeight,
      teamId: firstMembership?.teamId ?? null,
      teamRole: firstMembership?.teamRole ?? null,
      teamMemberships,
      user: registration.user ? UserResponseDto.fromDomain(registration.user) : null,
      club: registration.club ? ClubResponseDto.fromDomain(registration.club) : null,
      createdAt:
        registration.createdAt instanceof Date
          ? registration.createdAt.toISOString()
          : String(registration.createdAt || ''),
      updatedAt:
        registration.updatedAt instanceof Date
          ? registration.updatedAt.toISOString()
          : String(registration.updatedAt || ''),
    });
  }
}

export interface IRegistrationResponseDto extends RegistrationResponseDto {}
