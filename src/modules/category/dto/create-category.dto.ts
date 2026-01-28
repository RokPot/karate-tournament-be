import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
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
  Max,
} from 'class-validator';

import { Discipline, CategoryGender, BeltLevel } from '~common/enums';

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
    example: Discipline.KUMITE,
  })
  @IsEnum(Discipline)
  discipline!: Discipline;

  @Expose()
  @ApiProperty({
    description: 'Gender categories',
    enum: CategoryGender,
    isArray: true,
    example: [CategoryGender.MALE],
  })
  @IsArray()
  @IsEnum(CategoryGender, { each: true })
  gender!: CategoryGender[];

  @Expose()
  @ApiProperty({
    description: 'Minimum age',
    example: 18,
    minimum: 0,
  })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  ageMin!: number;

  @Expose()
  @ApiProperty({
    description: 'Maximum age',
    example: 35,
    minimum: 0,
  })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  ageMax!: number;

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
  @ApiProperty({
    description: 'Minimum belt level',
    enum: BeltLevel,
    example: BeltLevel.BROWN,
  })
  @IsEnum(BeltLevel)
  beltMin!: BeltLevel;

  @Expose()
  @ApiProperty({
    description: 'Maximum belt level',
    enum: BeltLevel,
    example: BeltLevel.BLACK,
  })
  @IsEnum(BeltLevel)
  beltMax!: BeltLevel;
}
