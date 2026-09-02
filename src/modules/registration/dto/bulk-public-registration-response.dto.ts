import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, plainToInstance, Type } from 'class-transformer';

import { UserResponseDto } from '../../user/dto/user-response.dto';

import { RegistrationResponseDto } from './registration-response.dto';

const dtoTransformOptions = {
  exposeDefaultValues: true,
  exposeUnsetFields: false,
} as const;

export class BulkRegistrationResultItemDto {
  constructor(data: Partial<BulkRegistrationResultItemDto>) {
    Object.assign(this, data);
  }

  static fromData(data: Partial<BulkRegistrationResultItemDto>): BulkRegistrationResultItemDto {
    return data instanceof BulkRegistrationResultItemDto
      ? data
      : plainToInstance(BulkRegistrationResultItemDto, data, dtoTransformOptions);
  }

  @Expose()
  @ApiProperty({ description: 'Index of the participant in the request array', example: 0 })
  participantIndex!: number;

  @Expose()
  @ApiProperty({ description: 'Index of the registration within the participant', example: 0 })
  registrationIndex!: number;

  @Expose()
  @ApiProperty({ description: 'Whether this registration was created successfully', example: true })
  success!: boolean;

  @Expose()
  @Type(() => RegistrationResponseDto)
  @ApiPropertyOptional({
    description: 'Created registration (present when success is true)',
    type: RegistrationResponseDto,
  })
  registration?: RegistrationResponseDto;

  @Expose()
  @ApiPropertyOptional({
    description: 'Error message (present when success is false)',
    example: 'User belt level (white) is not within category range',
  })
  error?: string;
}

export class BulkPublicRegistrationResponseDto {
  constructor(data: Partial<BulkPublicRegistrationResponseDto>) {
    Object.assign(this, data);
  }

  static fromParts(
    coach: UserResponseDto,
    results: BulkRegistrationResultItemDto[],
  ): BulkPublicRegistrationResponseDto {
    return plainToInstance(BulkPublicRegistrationResponseDto, { coach, results }, dtoTransformOptions);
  }

  @Expose()
  @Type(() => UserResponseDto)
  @ApiProperty({ description: 'Coach user', type: UserResponseDto })
  coach!: UserResponseDto;

  @Expose()
  @Type(() => BulkRegistrationResultItemDto)
  @ApiProperty({
    description: 'Per-registration results (partial success supported)',
    type: [BulkRegistrationResultItemDto],
  })
  results!: BulkRegistrationResultItemDto[];
}
