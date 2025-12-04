import { mock } from 'node:test';

import { Controller, Get, HttpStatus, type INestApplication, Query } from '@nestjs/common';
import { Expose, Type } from 'class-transformer';
import { IsEnum, IsOptional, IsString, IsUUID, ValidateNested } from 'class-validator';
import request from 'supertest';
import { beforeAll, describe, it } from 'vitest';

import { ValidationException } from '~common/exceptions';
import { getValidationPipe, TransformInputToArray } from '~common/validate';

import { createBaseTestingModule } from '~test/utils/base.testing-module';

import { PaginationQueryDto } from '../dtos/pagination-query.dto';
import { PaginationDto } from '../dtos/pagination.dto';
import { ApiPaginationResponse, PaginationFilter, PaginationOrder } from '../pagination.decorators';
import { IPagination, IPaginationOrder } from '../pagination.types';
import { transformInputToPaginationOrder } from '../transformers/input-to-pagination-order.transform';

/* Model Interfaces */

enum MyEnum {
  A = 'a',
  B = 'b',
}

interface IMyEntityChild {
  name: string;
}

interface IMyEntity {
  id: string;
  enum: MyEnum;
  child?: IMyEntityChild[];
}

/* Pagination Interfaces */

interface IMyEntityPaginationFilter {
  ids?: string[];
  enum?: MyEnum;
  'child.name'?: string;
}

enum MyEntityPaginationOrderField {
  id = 'id',
  enum = 'enum',
}

interface IMyEntityPaginationQuery {
  filter?: IMyEntityPaginationFilter;
  order?: IPaginationOrder<MyEntityPaginationOrderField>[];
}

/* Model DTOs */

class MyEntityChildDto implements IMyEntityChild {
  @Expose()
  @IsString()
  name!: string;
}

class MyEntityDto implements IMyEntity {
  @Expose()
  @IsString()
  readonly id!: string;

  @Expose()
  @IsEnum(MyEnum)
  readonly enum!: MyEnum;

  @Expose()
  @ValidateNested({ each: true })
  @Type(() => MyEntityChildDto)
  @IsOptional()
  readonly child?: MyEntityChildDto[];

  private constructor(data: MyEntityDto) {
    Object.assign(this, data);
  }

  static fromDomain(data: IMyEntity): MyEntityDto {
    return new MyEntityDto(data);
  }
}

/* Paginated List DTOs */

class MyEntityPaginationFilterDto {
  @Expose()
  @TransformInputToArray()
  @IsUUID('all', { each: true })
  @IsOptional()
  readonly ids?: string[];

  @Expose()
  @IsEnum(MyEnum)
  @IsOptional()
  readonly enum?: MyEnum;

  @Expose()
  @IsString()
  @IsOptional()
  readonly ['child.name']?: string;
}

class MyEntityPaginationQueryDto extends PaginationQueryDto {
  @Expose()
  @IsOptional()
  @PaginationOrder(MyEntityPaginationOrderField)
  readonly order?: IPaginationOrder<MyEntityPaginationOrderField>[];

  @Expose()
  @IsOptional()
  @PaginationFilter(MyEntityPaginationFilterDto)
  readonly filter?: MyEntityPaginationFilterDto;
}

/* */

const mockPaginateQueryCall = mock.fn(
  // check static types
  (query: IMyEntityPaginationQuery) =>
    query.order?.some((x) => x?.direction) &&
    !query.filter?.enum &&
    query.filter?.['child.name'] &&
    query.filter?.ids &&
    false,
);

@Controller()
class MyPaginatedController {
  @Get()
  @ApiPaginationResponse(MyEntityDto)
  async paginate(@Query() query: MyEntityPaginationQueryDto): Promise<PaginationDto<MyEntityDto>> {
    mockPaginateQueryCall(query);

    const entities: IPagination<IMyEntity> = {
      items: JSON.parse(
        JSON.stringify([
          { id: '1', enum: 'a' },
          { id: '2', enum: 'b' },
        ]),
      ),
      limit: query.limit,
      page: query.page || 1,
      totalItems: 2,
    };
    return PaginationDto.fromDomain(entities, MyEntityDto.fromDomain);
  }
}

describe('Pagination', () => {
  let app: INestApplication;

  let lastQuery: any;
  mockPaginateQueryCall.mock.mockImplementation((query) => {
    lastQuery = JSON.parse(JSON.stringify(query));
    return false;
  });

  beforeAll(async () => {
    app = await createBaseTestingModule(
      {
        controllers: [MyPaginatedController],
      },
      {
        beforeInit: (app) => {
          app.useGlobalPipes(getValidationPipe(ValidationException.fromValidationErrorArray));
          return app;
        },
      },
    );
  });

  it('should translate pagination orders', async ({ expect }) => {
    const transformer = transformInputToPaginationOrder();
    expect(transformer({ value: '' })).toEqual(undefined);
    expect(transformer({ value: 'id' })).toEqual([{ direction: 'asc', property: 'id' }]);
    expect(transformer({ value: '-id,name' })).toEqual([
      { direction: 'desc', property: 'id' },
      { direction: 'asc', property: 'name' },
    ]);
    expect(transformer({ value: ['-id,name', 'id'] })).toEqual([
      { direction: 'desc', property: 'id' },
      { direction: 'asc', property: 'name' },
      { direction: 'asc', property: 'id' }, // probably not a valid use case
    ]);
  });

  it('should paginate a model', async ({ expect }) => {
    const response = await request(app.getHttpServer())
      .get('/?order[enum]=desc&order[id]=asc&filter[enum]=b')
      .expect(HttpStatus.OK);

    expect(lastQuery).toEqual({
      limit: 20,
      order: [
        { property: 'enum', direction: 'desc' },
        { property: 'id', direction: 'asc' },
      ],
      filter: { enum: 'b' },
    });

    expect(response.body).toEqual({
      items: [
        { id: '1', enum: 'a' },
        { id: '2', enum: 'b' },
      ],
      limit: 20,
      page: 1,
      totalItems: 2,
    });
  });

  it('should cursror a model', async ({ expect }) => {
    await request(app.getHttpServer())
      .get('/?order[enum]=desc&order[id]=asc&filter[enum]=b&cursor=id')
      .expect(HttpStatus.OK);

    expect(lastQuery).toEqual({
      cursor: 'id',
      limit: 20,
      order: [
        { property: 'enum', direction: 'desc' },
        { property: 'id', direction: 'asc' },
      ],
      filter: { enum: 'b' },
    });
  });
});
