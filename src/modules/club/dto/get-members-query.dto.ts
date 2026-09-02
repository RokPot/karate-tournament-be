import { ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsEnum, IsOptional } from 'class-validator';

import { UserRole } from '~common/enums';

/**
 * Query DTO for GET club members.
 * Optional role filter: when set, only members with that role are returned.
 */
export class GetMembersQueryDto {
  @Expose()
  @ApiPropertyOptional({
    description: 'Filter members by role. Omit to return all members.',
    enum: UserRole,
  })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}
