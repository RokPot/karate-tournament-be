import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

import { Discipline, CategoryGender, BeltLevel } from '~common/enums';

import { Category } from '../category.entity';

/**
 * Category Response DTO
 * Data transfer object for category responses.
 */
export class CategoryResponseDto {
  @Expose()
  @ApiProperty({
    description: 'Category ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id!: string;

  @Expose()
  @ApiProperty({
    description: 'Category name',
    example: 'Men Kumite -75kg',
  })
  name!: string;

  @Expose()
  @ApiProperty({
    description: 'Discipline',
    enum: Discipline,
    example: Discipline.KUMITE,
  })
  discipline!: Discipline;

  @Expose()
  @ApiProperty({
    description: 'Gender categories',
    enum: CategoryGender,
    isArray: true,
    example: [CategoryGender.MALE],
  })
  gender!: CategoryGender[];

  @Expose()
  @ApiProperty({
    description: 'Minimum age',
    example: 18,
  })
  ageMin!: number;

  @Expose()
  @ApiProperty({
    description: 'Maximum age',
    example: 35,
  })
  ageMax!: number;

  @Expose()
  @ApiPropertyOptional({
    description: 'Minimum weight in kg',
    example: 70.0,
    nullable: true,
  })
  weightMin!: number | null;

  @Expose()
  @ApiPropertyOptional({
    description: 'Maximum weight in kg',
    example: 75.0,
    nullable: true,
  })
  weightMax!: number | null;

  @Expose()
  @ApiProperty({
    description: 'Minimum belt level',
    enum: BeltLevel,
    example: BeltLevel.BROWN,
  })
  beltMin!: BeltLevel;

  @Expose()
  @ApiProperty({
    description: 'Maximum belt level',
    enum: BeltLevel,
    example: BeltLevel.BLACK,
  })
  beltMax!: BeltLevel;

  @Expose()
  @ApiProperty({
    description: 'Creation timestamp',
    example: '2024-01-01T00:00:00.000Z',
    type: String,
    format: 'date-time',
  })
  createdAt!: string;

  @Expose()
  @ApiProperty({
    description: 'Last update timestamp',
    example: '2024-01-01T00:00:00.000Z',
    type: String,
    format: 'date-time',
  })
  updatedAt!: string;

  constructor(data: ICategoryResponseDto) {
    Object.assign(this, data);
  }

  /**
   * Creates a CategoryResponseDto instance from a Category entity
   */
  static fromDomain(category: Category): CategoryResponseDto {
    return new CategoryResponseDto({
      id: category.id,
      name: category.name,
      discipline: category.discipline,
      gender: category.gender,
      ageMin: category.ageMin,
      ageMax: category.ageMax,
      weightMin:
        category.weightMin != null && typeof category.weightMin === 'string'
          ? parseFloat(category.weightMin)
          : category.weightMin,
      weightMax:
        category.weightMax != null && typeof category.weightMax === 'string'
          ? parseFloat(category.weightMax)
          : category.weightMax,
      beltMin: category.beltMin,
      beltMax: category.beltMax,
      createdAt:
        category.createdAt instanceof Date ? category.createdAt.toISOString() : String(category.createdAt || ''),
      updatedAt:
        category.updatedAt instanceof Date ? category.updatedAt.toISOString() : String(category.updatedAt || ''),
    });
  }
}

export interface ICategoryResponseDto extends CategoryResponseDto {}
