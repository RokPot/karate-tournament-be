import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsEmail, IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class RosterIdentityDto {
  @Expose()
  @ApiProperty({
    description: 'Tournament ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID('4')
  tournamentId!: string;

  @Expose()
  @ApiProperty({ description: 'Coach email', example: 'coach@club.com' })
  @IsEmail()
  email!: string;

  @Expose()
  @ApiPropertyOptional({
    description: 'Club name as typed on the form',
    example: 'SKIF Ljubljana',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  clubName?: string;
}
