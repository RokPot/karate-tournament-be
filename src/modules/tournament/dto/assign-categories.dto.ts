import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { ArrayMinSize, IsArray, IsUUID } from 'class-validator';

/**
 * DTO for assigning categories to a tournament.
 * Replaces all currently assigned categories with the given list.
 */
export class AssignCategoriesDto {
  @Expose()
  @ApiProperty({
    description:
      'Category IDs to assign to the tournament. Any previously assigned categories not in this list are unassigned.',
    example: ['123e4567-e89b-12d3-a456-426614174000', '223e4567-e89b-12d3-a456-426614174001'],
    type: String,
    format: 'uuid',
    isArray: true,
  })
  @IsArray()
  @ArrayMinSize(0)
  @IsUUID('4', { each: true })
  categoryIds!: string[];
}
