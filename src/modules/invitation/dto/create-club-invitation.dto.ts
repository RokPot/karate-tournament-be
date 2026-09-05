import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsEmail, IsEnum, IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

import { UserRole } from '~common/enums';

const CLUB_INVITE_ROLES: UserRole[] = [UserRole.CLUB_OWNER, UserRole.CLUB_COACH, UserRole.CLUB_MEMBER];

/**
 * Body for POST /clubs/:id/invitations.
 */
export class CreateClubInvitationDto {
  @Expose()
  @ApiProperty({
    description: 'Invitee email',
    example: 'member@example.com',
    maxLength: 255,
  })
  @IsEmail()
  @MaxLength(255)
  email!: string;

  @Expose()
  @ApiPropertyOptional({
    description: 'Invitee first name',
    example: 'Jane',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  firstName?: string;

  @Expose()
  @ApiPropertyOptional({
    description: 'Invitee last name',
    example: 'Doe',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  lastName?: string;

  @Expose()
  @ApiPropertyOptional({
    description: 'Role to assign on accept. Defaults to club_member.',
    enum: [UserRole.CLUB_OWNER, UserRole.CLUB_COACH, UserRole.CLUB_MEMBER],
    example: UserRole.CLUB_MEMBER,
  })
  @IsOptional()
  @IsEnum(UserRole)
  @IsIn(CLUB_INVITE_ROLES)
  role?: UserRole;
}
