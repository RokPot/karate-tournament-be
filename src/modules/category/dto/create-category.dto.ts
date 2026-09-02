import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { IsString, IsEnum, IsNumber, IsInt, IsOptional, MaxLength, Min, ValidateIf } from 'class-validator';

import { Discipline, SubDiscipline, CategoryGender, BeltLevel } from '~common/enums';

/**
 * Create Category DTO
 * Data transfer object for creating a new category.
 */
export class CreateCategoryDto {
  @Expose()
  @ApiProperty({
    description: 'Category name',
    example: 'Men Kumite -75kg',
    maxLength: 255,
  })
  @IsString()
  @MaxLength(255)
  name!: string;

  @Expose()
  @ApiProperty({
    description: 'Discipline',
    enum: Discipline,
    example: Discipline.YAKO_SOKU_KUMITE,
  })
  @IsEnum(Discipline)
  discipline!: Discipline;

  @Expose()
  @ApiPropertyOptional({
    description: 'Sub-discipline (null/omit = not specified)',
    enum: SubDiscipline,
    example: SubDiscipline.GOHON_IPPON_KUMITE,
    nullable: true,
  })
  @IsOptional()
  @ValidateIf((_o, v) => v != null)
  @IsEnum(SubDiscipline)
  subDiscipline?: SubDiscipline | null;

  @Expose()
  @ApiPropertyOptional({
    description: 'Category gender (null/omit = no gender restriction)',
    enum: CategoryGender,
    example: CategoryGender.MALE,
    nullable: true,
  })
  @IsOptional()
  @ValidateIf((_o, v) => v != null)
  @IsEnum(CategoryGender)
  gender?: CategoryGender | null;

  @Expose()
  @ApiPropertyOptional({
    description: 'Minimum age in years (0 = no lower limit). Nullable.',
    example: 18,
    minimum: 0,
    nullable: true,
  })
  @IsOptional()
  @ValidateIf((_o, v) => v != null)
  @Type(() => Number)
  @IsInt()
  @Min(0)
  ageMin?: number | null;

  @Expose()
  @ApiPropertyOptional({
    description: 'Maximum age in years (0 = no upper limit). Nullable.',
    example: 35,
    minimum: 0,
    nullable: true,
  })
  @IsOptional()
  @ValidateIf((_o, v) => v != null)
  @Type(() => Number)
  @IsInt()
  @Min(0)
  ageMax?: number | null;

  @Expose()
  @ApiPropertyOptional({
    description: 'Minimum weight in kg (0 = no lower limit). Nullable.',
    example: 70.0,
    minimum: 0,
    nullable: true,
  })
  @IsOptional()
  @ValidateIf((_o, v) => v != null)
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  weightMin?: number | null;

  @Expose()
  @ApiPropertyOptional({
    description: 'Maximum weight in kg (0 = no upper limit). Nullable.',
    example: 75.0,
    minimum: 0,
    nullable: true,
  })
  @IsOptional()
  @ValidateIf((_o, v) => v != null)
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  weightMax?: number | null;

  @Expose()
  @ApiPropertyOptional({
    description: 'Minimum belt level (null/omit = no lower limit)',
    enum: BeltLevel,
    example: BeltLevel.KYU_4,
    nullable: true,
  })
  @IsOptional()
  @ValidateIf((_o, v) => v != null)
  @IsEnum(BeltLevel)
  beltMin?: BeltLevel | null;

  @Expose()
  @ApiPropertyOptional({
    description: 'Maximum belt level (null/omit = no upper limit)',
    enum: BeltLevel,
    example: BeltLevel.DAN_2,
    nullable: true,
  })
  @IsOptional()
  @ValidateIf((_o, v) => v != null)
  @IsEnum(BeltLevel)
  beltMax?: BeltLevel | null;

  @Expose()
  @ApiPropertyOptional({
    description: 'Main team roster size (null/omit = not applicable for individual categories)',
    example: 3,
    minimum: 0,
    nullable: true,
  })
  @IsOptional()
  @ValidateIf((_o, v) => v != null)
  @Type(() => Number)
  @IsInt()
  @Min(0)
  teamSize?: number | null;

  @Expose()
  @ApiPropertyOptional({
    description: 'Number of reserve participants allowed (null/omit = not applicable)',
    example: 1,
    minimum: 0,
    nullable: true,
  })
  @IsOptional()
  @ValidateIf((_o, v) => v != null)
  @Type(() => Number)
  @IsInt()
  @Min(0)
  teamReservesSize?: number | null;
}
