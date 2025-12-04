import 'reflect-metadata';

import assert from 'node:assert/strict';

import { Expose, Type } from 'class-transformer';
import { IsBoolean, IsEmail, IsNumber, IsOptional, ValidateNested } from 'class-validator';
import { describe, it } from 'vitest';

import { plainToValidatedInstance, TransformInputToBoolean, ValidationErrors } from '~common/validate';

import { validationErrorsToValidationExceptionErrors } from './validation-exception-response.transform';

class ARedDto {
  @Expose()
  @IsEmail()
  purple!: string;

  @IsOptional()
  @IsNumber()
  morange?: number;
}

class ABlueDto {
  @Expose()
  @TransformInputToBoolean()
  @IsBoolean()
  orange!: boolean;
}

class AnDto {
  @Expose()
  @IsEmail()
  yellow!: string;

  @Expose()
  @ValidateNested({ each: true })
  @Type(() => ARedDto)
  pistachio!: ARedDto[];

  @Expose()
  @ValidateNested()
  @Type(() => ABlueDto)
  green!: ABlueDto;
}

describe('ValidationExceptionResponse', () => {
  it('should return dot-separated-path validation errors', () => {
    try {
      plainToValidatedInstance(AnDto, {
        yellow: 'not-email',
        pistachio: [{ purple: 'not-email' }, { purple: 'an@email.com' }, { purple: 5 }],
        green: { orange: 'not-boolean' },
      });
    } catch (error) {
      assert(error instanceof ValidationErrors);

      assert.deepEqual(validationErrorsToValidationExceptionErrors(error.errors), {
        yellow: [
          {
            type: 'isEmail',
            message: 'yellow must be an email',
          },
        ],
        'pistachio.0.purple': [
          {
            type: 'isEmail',
            message: 'purple must be an email',
          },
        ],
        'pistachio.2.purple': [
          {
            type: 'isEmail',
            message: 'purple must be an email',
          },
        ],
        'green.orange': [
          {
            type: 'isBoolean',
            message: 'orange must be a boolean value',
          },
        ],
      });
    }
  });
});
