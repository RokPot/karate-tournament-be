import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsString, Length, Matches } from 'class-validator';

import { ApiDateTimeProperty } from '~common/swagger/api-date.decorators';

import { RosterIdentityDto } from './roster-identity.dto';

export class RosterOtpRequestDto extends RosterIdentityDto {}

export class RosterOtpResponseDto {
  @Expose()
  @ApiPropertyOptional({
    description: 'Present only when mail is disabled outside production, for local continue testing',
    example: '123456',
  })
  debugCode?: string;

  constructor(data: RosterOtpResponseDto) {
    Object.assign(this, data);
  }
}

export class RosterOtpVerifyDto extends RosterIdentityDto {
  @Expose()
  @ApiProperty({ description: '6-digit code from email', example: '123456' })
  @IsString()
  @Length(6, 6)
  @Matches(/^\d{6}$/)
  code!: string;
}

export class RosterOtpVerifyResponseDto {
  @Expose()
  @ApiProperty({ description: 'Short-lived access token for GET/PUT current roster' })
  accessToken!: string;

  @Expose()
  @ApiDateTimeProperty({ description: 'When this access token expires' })
  expiresAt!: string;

  @Expose()
  @ApiDateTimeProperty({ description: 'Roster updatedAt for later PUT If-Match' })
  updatedAt!: string;

  constructor(data: RosterOtpVerifyResponseDto) {
    Object.assign(this, data);
  }
}
