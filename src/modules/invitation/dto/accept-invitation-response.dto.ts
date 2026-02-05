import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

import type { Club } from '../../club/club.entity';
import { ClubResponseDto } from '../../club/dto/club-response.dto';
import { UserResponseDto } from '../../user/dto/user-response.dto';
import type { User } from '../../user/user.entity';

/**
 * Accept invitation response DTO
 * Returned by POST /invitations/:token/accept.
 */
export class AcceptInvitationResponseDto {
  @Expose()
  @ApiProperty({
    description: 'Updated user (linked to club with owner role)',
  })
  user!: UserResponseDto;

  @Expose()
  @ApiProperty({
    description: 'Club the user was linked to',
  })
  club!: ClubResponseDto;

  constructor(data: AcceptInvitationResponseDto) {
    Object.assign(this, data);
  }

  static fromDomain(user: User, club: Club): AcceptInvitationResponseDto {
    return new AcceptInvitationResponseDto({
      user: UserResponseDto.fromDomain(user),
      club: ClubResponseDto.fromDomain(club),
    });
  }
}
