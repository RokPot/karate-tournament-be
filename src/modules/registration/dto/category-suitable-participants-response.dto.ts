import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';

import { BeltLevel, Gender } from '~common/enums';
import { ApiDateTimeProperty } from '~common/swagger/api-date.decorators';

import { CategoryResponseDto } from '../../category/dto/category-response.dto';

/**
 * One eligible participant for a category (maps to request participants[] index).
 */
export class SuitableParticipantDto {
  constructor(data: Partial<SuitableParticipantDto>) {
    Object.assign(this, data);
  }

  @Expose()
  @ApiProperty({
    description: 'Index in the request participants array (0-based)',
    example: 0,
    minimum: 0,
  })
  participantIndex!: number;

  @Expose()
  @ApiProperty({ description: 'First name', example: 'Tok' })
  firstName!: string;

  @Expose()
  @ApiProperty({ description: 'Last name', example: 'Pok' })
  lastName!: string;

  @Expose()
  @ApiProperty({ description: 'Weight in kg', example: 50 })
  weight!: number;

  @Expose()
  @ApiDateTimeProperty({
    description: 'Date of birth',
    example: '2012-05-19T00:00:00.000Z',
  })
  dateOfBirth!: string;

  @Expose()
  @ApiPropertyOptional({ description: 'Gender', enum: Gender, nullable: true })
  gender?: Gender | null;

  @Expose()
  @ApiPropertyOptional({ description: 'Belt level', enum: BeltLevel, nullable: true })
  beltLevel?: BeltLevel | null;
}

/**
 * One tournament category with participants eligible for it.
 */
export class CategorySuitableParticipantsItemDto {
  constructor(data: Partial<CategorySuitableParticipantsItemDto>) {
    Object.assign(this, data);
  }

  @Expose()
  @Type(() => CategoryResponseDto)
  @ApiProperty({ description: 'Tournament category', type: CategoryResponseDto })
  category!: CategoryResponseDto;

  @Expose()
  @Type(() => SuitableParticipantDto)
  @ApiProperty({
    description: 'Participants eligible for this category (empty if none match)',
    type: [SuitableParticipantDto],
  })
  participants!: SuitableParticipantDto[];
}
