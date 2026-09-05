import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

import { Discipline, SubDiscipline, CategoryGender, BeltLevel } from '~common/enums';

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
    example: Discipline.YAKO_SOKU_KUMITE,
  })
  discipline!: Discipline;

  @Expose()
  @ApiPropertyOptional({
    description: 'Sub-discipline (null = not specified)',
    enum: SubDiscipline,
    example: SubDiscipline.GOHON_IPPON_KUMITE,
    nullable: true,
  })
  subDiscipline!: SubDiscipline | null;

  @Expose()
  @ApiPropertyOptional({
    description: 'Category gender (null = no gender restriction)',
    enum: CategoryGender,
    example: CategoryGender.MALE,
    nullable: true,
  })
  gender!: CategoryGender | null;

  @Expose()
  @ApiPropertyOptional({
    description: 'Minimum age in years (0 = no lower limit)',
    example: 18,
    nullable: true,
  })
  ageMin!: number | null;

  @Expose()
  @ApiPropertyOptional({
    description: 'Maximum age in years (0 = no upper limit)',
    example: 35,
    nullable: true,
  })
  ageMax!: number | null;

  @Expose()
  @ApiPropertyOptional({
    description: 'Minimum weight in kg (0 = no lower limit)',
    example: 70.0,
    nullable: true,
  })
  weightMin!: number | null;

  @Expose()
  @ApiPropertyOptional({
    description: 'Maximum weight in kg (0 = no upper limit)',
    example: 75.0,
    nullable: true,
  })
  weightMax!: number | null;

  @Expose()
  @ApiPropertyOptional({
    description: 'Minimum belt level (null = no lower limit)',
    enum: BeltLevel,
    example: BeltLevel.KYU_4,
    nullable: true,
  })
  beltMin!: BeltLevel | null;

  @Expose()
  @ApiPropertyOptional({
    description: 'Maximum belt level (null = no upper limit)',
    enum: BeltLevel,
    example: BeltLevel.DAN_2,
    nullable: true,
  })
  beltMax!: BeltLevel | null;

  @Expose()
  @ApiPropertyOptional({
    description: 'Main team roster size (null = not applicable)',
    example: 3,
    nullable: true,
  })
  teamSize!: number | null;

  @Expose()
  @ApiPropertyOptional({
    description: 'Number of reserve participants allowed (null = not applicable)',
    example: 1,
    nullable: true,
  })
  teamReservesSize!: number | null;

  @Expose()
  @ApiPropertyOptional({
    description: 'Owning club ID (null = global catalog)',
    example: '123e4567-e89b-12d3-a456-426614174000',
    nullable: true,
  })
  clubId!: string | null;

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
      subDiscipline: category.subDiscipline,
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
      teamSize: category.teamSize,
      teamReservesSize: category.teamReservesSize,
      clubId: category.clubId ?? null,
      createdAt:
        category.createdAt instanceof Date ? category.createdAt.toISOString() : String(category.createdAt || ''),
      updatedAt:
        category.updatedAt instanceof Date ? category.updatedAt.toISOString() : String(category.updatedAt || ''),
    });
  }
}

export interface ICategoryResponseDto extends CategoryResponseDto {}
