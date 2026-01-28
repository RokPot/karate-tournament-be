import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsUUID } from 'class-validator';

import { CreateCategoryDto } from './create-category.dto';

/**
 * Create Category With Tournament DTO
 * Data transfer object for creating a new category and assigning it to a tournament.
 */
export class CreateCategoryWithTournamentDto extends CreateCategoryDto {
  @Expose()
  @ApiProperty({
    description: 'Tournament ID to assign the category to',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID('4')
  tournamentId!: string;
}
