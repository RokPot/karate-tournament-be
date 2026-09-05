import { ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsOptional, IsUUID } from 'class-validator';

/**
 * Query DTO for GET /invitations.
 */
export class InvitationListQueryDto {
  @Expose()
  @ApiPropertyOptional({
    description: 'Filter invitations by club ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsUUID('4')
  clubId?: string;
}
