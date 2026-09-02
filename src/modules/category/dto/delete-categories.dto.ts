import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { ArrayMinSize, IsArray, IsUUID } from 'class-validator';

/**
 * DTO for deleting one or more categories.
 */
export class DeleteCategoriesDto {
  @Expose()
  @ApiProperty({
    description: 'Category IDs to delete',
    example: ['123e4567-e89b-12d3-a456-426614174000', '223e4567-e89b-12d3-a456-426614174001'],
    type: String,
    format: 'uuid',
    isArray: true,
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID('4', { each: true })
  categoryIds!: string[];
}
