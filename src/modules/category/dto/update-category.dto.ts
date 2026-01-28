import { ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import {
  IsString,
  IsEnum,
  IsArray,
  IsNumber,
  IsInt,
  IsOptional,
  MaxLength,
  Min,
} from 'class-validator';

import { Discipline, CategoryGender, BeltLevel } from '~common/enums';

/**
 * Update Category DTO
 * Data transfer object for updating a category.
 */
export class UpdateCategoryDto {
  @Expose()
  @ApiPropertyOptional({
    description: 'Category name',
    example: 'Men Kumite -75kg',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @Expose()
  @ApiPropertyOptional({
    description: 'Discipline',
    enum: Discipline,
    example: Discipline.KUMITE,
  })
  @IsOptional()
  @IsEnum(Discipline)
  discipline?: Discipline;

  @Expose()
  @ApiPropertyOptional({
    description: 'Gender categories',
    enum: CategoryGender,
    isArray: true,
    example: [CategoryGender.MALE],
  })
  @IsOptional()
  @IsArray()
  @IsEnum(CategoryGender, { each: true })
  gender?: CategoryGender[];

  @Expose()
  @ApiPropertyOptional({
    description: 'Minimum age',
    example: 18,
    minimum: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  ageMin?: number;

  @Expose()
  @ApiPropertyOptional({
    description: 'Maximum age',
    example: 35,
    minimum: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  ageMax?: number;

  @Expose()
  @ApiPropertyOptional({
    description: 'Minimum weight in kg',
    example: 70.0,
    minimum: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  weightMin?: number;

  @Expose()
  @ApiPropertyOptional({
    description: 'Maximum weight in kg',
    example: 75.0,
    minimum: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  weightMax?: number;

  @Expose()
  @ApiPropertyOptional({
    description: 'Minimum belt level',
    enum: BeltLevel,
    example: BeltLevel.BROWN,
  })
  @IsOptional()
  @IsEnum(BeltLevel)
  beltMin?: BeltLevel;

  @Expose()
  @ApiPropertyOptional({
    description: 'Maximum belt level',
    enum: BeltLevel,
    example: BeltLevel.BLACK,
  })
  @IsOptional()
  @IsEnum(BeltLevel)
  beltMax?: BeltLevel;
}
