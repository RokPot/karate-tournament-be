import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsString, MinLength } from 'class-validator';

import { ApiDateTimeProperty } from '~common/swagger/api-date.decorators';

import { BulkPublicRegistrationDto } from './bulk-public-registration.dto';

export class RosterPutDto extends BulkPublicRegistrationDto {
  @Expose()
  @ApiProperty({ description: 'Access token from OTP verify' })
  @IsString()
  @MinLength(16)
  accessToken!: string;

  @Expose()
  @ApiDateTimeProperty({
    description: 'Roster updatedAt from GET; must match or the request is rejected with 409',
  })
  @IsString()
  updatedAt!: string;
}
