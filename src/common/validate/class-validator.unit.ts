import 'reflect-metadata';

import { plainToInstance, Type } from 'class-transformer';
import {
  IsBoolean,
  IsOptional,
  IsDate,
  IsEnum,
  IsUUID,
  IsString,
  IsArray,
  IsNumber,
  validateSync,
} from 'class-validator';
import { it, describe } from 'vitest';

import { TransformInputToArray } from './transformers/input-to-array.transformer';
import { TransformInputToBoolean } from './transformers/input-to-boolean.transformer';

enum AnEnum {
  'A' = 'A',
  'B' = 'B',
  'C' = 'C',
}

export class AnDto {
  @IsArray()
  @IsString({ each: true })
  @TransformInputToArray({ transformer: String })
  ar1?: string[];

  @IsArray()
  @IsString({ each: true })
  @TransformInputToArray({ transformer: String })
  ar2: string[] = ['the', 'default'];

  @IsArray()
  @IsNumber({}, { each: true })
  @TransformInputToArray({ transformer: Number })
  ar3: number[] = [1, 2];

  @IsArray()
  @IsNumber({}, { each: true })
  @TransformInputToArray({ transformer: Number, separator: ';' })
  ar4: number[] = [1, 2];

  @IsArray()
  @IsUUID('all', { each: true })
  @TransformInputToArray()
  ar5!: string[];

  @IsBoolean()
  @TransformInputToBoolean()
  bol1: boolean = false;

  @IsBoolean()
  @IsOptional()
  @TransformInputToBoolean()
  bol2!: boolean;

  @Type(() => Boolean)
  @IsBoolean()
  bol3!: boolean;

  @IsBoolean()
  @TransformInputToBoolean()
  bol4: boolean = true;

  @IsUUID('4')
  uuid1!: string;

  @IsString()
  str1!: string;

  @Type(() => Number)
  @IsNumber()
  num1!: number;

  @Type(() => Date)
  @IsDate()
  date1!: Date;

  @IsEnum(AnEnum)
  enum1!: AnEnum;
}

function testClassValidator(
  dto: any,
  data: Record<
    string,
    {
      value?: any;
      transformed?: boolean;
      value2?: any;
      constraints?: any;
    }
  >,
  expect: any,
) {
  const transformedObject = Object.fromEntries(Object.entries(data).map(([property, { value }]) => [property, value]));

  const instance = plainToInstance(dto, transformedObject, {
    exposeDefaultValues: true,
    exposeUnsetFields: false,
    strategy: 'exposeAll', // excludeAll needs @Expose for all properties
  });

  expect(instance).toEqual(
    Object.fromEntries(
      Object.entries(data).map(([property, obj]) => [property, obj.transformed ? obj.value2 : obj.value]),
    ),
  );

  const issues = validateSync(instance as any, { whitelist: true, forbidNonWhitelisted: true });

  expect(issues).toEqual(
    expect.arrayContaining(
      Object.entries(data)
        .filter(([, { constraints }]) => constraints)
        .map(([key, { constraints }]) => expect.objectContaining({ property: key, constraints })),
    ),
  );

  const keysWithIssues = new Set(
    Object.entries(data)
      .filter(([, { constraints }]) => constraints)
      .map(([key]) => key),
  );

  expect(issues.filter(({ property }) => !keysWithIssues.has(property))).toEqual([]);
}

describe('ClassValidator', () => {
  it('ClassValidator Happy Path', ({ expect }) => {
    testClassValidator(
      AnDto,
      {
        ar1: { value: 'hello, world', transformed: true, value2: ['hello', 'world'] },
        ar2: { transformed: true, value2: ['the', 'default'] },
        ar3: { value: '4.3, 5.1', transformed: true, value2: [4.3, 5.1] },
        ar4: {
          value: '4.3, 5.1',
          transformed: true,
          value2: [NaN],
          constraints: { isNumber: 'each value in ar4 must be a number conforming to the specified constraints' },
        },
        ar5: {
          value: '082b5f86-ac6d-4819-bec4-98d14105aacd',
          transformed: true,
          value2: ['082b5f86-ac6d-4819-bec4-98d14105aacd'],
        },
        bol1: { value: 'true', transformed: true, value2: true },
        bol3: { value: true },
        bol4: { value: false, transformed: false, value2: false },
        uuid1: { value: '082b5f86-ac6d-4819-bec4-98d14105aacd' },
        str1: { value: 'an string' },
        num1: { value: '1', transformed: true, value2: 1 },
        date1: {
          value: '2000-10-31T01:30:00.000-05:00',
          transformed: true,
          value2: new Date('2000-10-31T06:30:00.000Z'),
        },
        enum1: { value: 'A' },
      },
      expect,
    );
  });

  it('ClassValidator Invalid Input', ({ expect }) => {
    testClassValidator(
      AnDto,
      {
        ar1: { value: 'hello; world', transformed: true, value2: ['hello; world'] },
        ar2: { transformed: true, value2: ['the', 'default'] },
        ar3: {
          value: '4.a3, 5.1',
          transformed: true,
          value2: [NaN, 5.1],
          constraints: { isNumber: 'each value in ar3 must be a number conforming to the specified constraints' },
        },
        ar4: {
          value: '4.3, 5.1',
          transformed: true,
          value2: [NaN],
          constraints: { isNumber: 'each value in ar4 must be a number conforming to the specified constraints' },
        },
        ar5: {
          value: '082b5f86-ac6d-4819-bec4-98d14105aacd',
          transformed: true,
          value2: ['082b5f86-ac6d-4819-bec4-98d14105aacd'],
        },
        bol1: { value: 'f', transformed: true, value2: false },
        bol3: { value: false },
        bol4: { value: undefined, transformed: true, value2: true },
        uuid1: { value: '082b5fad14105aacd', constraints: { isUuid: 'uuid1 must be a UUID' } },
        str1: { value: 5, constraints: { isString: 'str1 must be a string' } },
        num1: { value: 1 },
        date1: {
          value: '2000-10-31',
          transformed: true,
          value2: new Date('2000-10-31'),
        },
        enum1: { value: 'G', constraints: { isEnum: 'enum1 must be one of the following values: A, B, C' } },
      },
      expect,
    );
  });
});
