import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';

import { TransformObjectToArray } from './transformers/object-to-array.transform';

/**
 * One team roster in a bulk public registration request.
 */
export class BulkTeamDto {
  @Expose()
  @ApiProperty({
    description: 'Team category ID (must be a team discipline on the tournament)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID('4')
  categoryId!: string;

  @Expose()
  @ApiPropertyOptional({
    description: 'Team display name. Omit to generate from club name or starter last names.',
    example: 'SKIF Ljubljana A',
    maxLength: 255,
  })
  @IsOptional()
  @ValidateIf((_o, v) => v != null && String(v).trim() !== '')
  @IsString()
  @MaxLength(255)
  name?: string;

  @Expose()
  @ApiProperty({
    description: 'Participant indexes for starters (length must equal category teamSize)',
    type: [Number],
    example: [0, 1, 2],
  })
  @TransformObjectToArray()
  @IsArray()
  @ArrayMinSize(1)
  @Type(() => Number)
  @IsInt({ each: true })
  @Min(0, { each: true })
  starters!: number[];

  @Expose()
  @ApiPropertyOptional({
    description: 'Participant indexes for reserves',
    type: [Number],
    example: [3],
  })
  @IsOptional()
  @TransformObjectToArray()
  @IsArray()
  @Type(() => Number)
  @IsInt({ each: true })
  @Min(0, { each: true })
  reserves?: number[];
}
