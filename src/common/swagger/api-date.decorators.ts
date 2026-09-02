import { ApiProperty, ApiPropertyOptional, type ApiPropertyOptions } from '@nestjs/swagger';

type ApiDateOptions = Pick<ApiPropertyOptions, 'description' | 'example' | 'nullable'>;

const DATE_TIME_EXAMPLE = '2024-01-01T00:00:00.000Z';
const DATE_ONLY_EXAMPLE = '7.7.2000';

/** OpenAPI date-time string (same shape as createdAt / updatedAt on response DTOs). */
export function ApiDateTimeProperty(options: ApiDateOptions): PropertyDecorator {
  return ApiProperty({
    description: options.description,
    example: options.example ?? DATE_TIME_EXAMPLE,
    type: String,
    format: 'date-time',
    ...(options.nullable ? { nullable: true } : {}),
  });
}

export function ApiDateTimePropertyOptional(options: ApiDateOptions): PropertyDecorator {
  return ApiPropertyOptional({
    description: options.description,
    example: options.example ?? DATE_TIME_EXAMPLE,
    type: String,
    format: 'date-time',
    nullable: options.nullable ?? true,
  });
}

/** OpenAPI date-only string (D.M.YYYY or YYYY-MM-DD) for request bodies and query params. */
export function ApiDateOnlyProperty(options: ApiDateOptions): PropertyDecorator {
  return ApiProperty({
    description: options.description,
    example: options.example ?? DATE_ONLY_EXAMPLE,
    type: String,
    format: 'date',
    ...(options.nullable ? { nullable: true } : {}),
  });
}

export function ApiDateOnlyPropertyOptional(options: ApiDateOptions): PropertyDecorator {
  return ApiPropertyOptional({
    description: options.description,
    example: options.example ?? DATE_ONLY_EXAMPLE,
    type: String,
    format: 'date',
    nullable: options.nullable ?? true,
  });
}
