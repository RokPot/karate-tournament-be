import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

/**
 * Registration count for one assigned tournament category.
 */
export class TournamentRegistrationCountItemDto {
  @Expose()
  @ApiProperty({
    description: 'Assigned category ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  categoryId!: string;

  @Expose()
  @ApiProperty({
    description: 'Number of registrations in this category (including zero)',
    example: 0,
  })
  registrationCount!: number;

  constructor(data: TournamentRegistrationCountItemDto) {
    Object.assign(this, data);
  }

  static fromData(categoryId: string, registrationCount: number): TournamentRegistrationCountItemDto {
    return new TournamentRegistrationCountItemDto({
      categoryId,
      registrationCount,
    });
  }
}
