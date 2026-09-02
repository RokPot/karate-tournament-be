import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';

import { BeltLevel, Gender } from '~common/enums';
import { ApiDateTimeProperty } from '~common/swagger/api-date.decorators';

import { CategoryResponseDto } from '../../category/dto/category-response.dto';

/**
 * One participant with their suitable categories for a tournament.
 */
export class PublicParticipantSuitableCategoriesItemDto {
  constructor(data: Partial<PublicParticipantSuitableCategoriesItemDto>) {
    Object.assign(this, data);
  }

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

  @Expose()
  @Type(() => CategoryResponseDto)
  @ApiProperty({
    description: 'Categories this participant is eligible for',
    type: [CategoryResponseDto],
  })
  categories!: CategoryResponseDto[];
}
