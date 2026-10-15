import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsString, MinLength } from 'class-validator';

export class RosterGetQueryDto {
  @Expose()
  @ApiProperty({ description: 'Access token from OTP verify' })
  @IsString()
  @MinLength(16)
  accessToken!: string;
}
