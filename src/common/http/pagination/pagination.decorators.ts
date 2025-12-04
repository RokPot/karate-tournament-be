import { applyDecorators } from '@nestjs/common';
import { ApiExtraModels, ApiOkResponse, ApiPropertyOptional, getSchemaPath } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ValidateNested, type ValidationOptions } from 'class-validator';

import { TransformInputToPaginationOrder } from '~common/http/pagination/transformers/input-to-pagination-order.transform';

import { PaginationDto } from './dtos/pagination.dto';
import { IsPaginationOrder } from './validators/pagination-order.validator';

export const ApiPaginationResponse = (model: any) => {
  return applyDecorators(
    ApiExtraModels(PaginationDto),
    ApiExtraModels(model),
    ApiOkResponse({
      schema: {
        allOf: [
          { $ref: getSchemaPath(PaginationDto) },
          {
            properties: {
              items: {
                type: 'array',
                items: { $ref: getSchemaPath(model) },
              },
            },
          },
        ],
      },
    }),
  );
};

export function PaginationOrder<T extends Record<string, string | number>>(
  enumConstraint: T,
  validationOptions?: ValidationOptions,
) {
  return applyDecorators(
    TransformInputToPaginationOrder(),
    IsPaginationOrder(enumConstraint, validationOptions),
    ApiPropertyOptional({
      type: String,
      example: Object.keys(enumConstraint).length ? Object.keys(enumConstraint)[0] : '',
      description: `Order by fields (comma separated with +/- prefix): ${Object.keys(enumConstraint).join(', ')}`,
    }),
  );
}

export function PaginationFilter<T extends new () => any>(enumConstraint: T) {
  return applyDecorators(
    Type(() => enumConstraint),
    ValidateNested(),
  );
}
