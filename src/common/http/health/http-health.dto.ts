import { Expose } from 'class-transformer';
import { IsOptional, IsString } from 'class-validator';

export class HttpHealthDto {
  @Expose()
  @IsString()
  @IsOptional()
  readonly uptime?: string;

  @Expose()
  @IsString()
  @IsOptional()
  readonly stage?: string;

  @Expose()
  @IsString()
  @IsOptional()
  readonly version?: string;

  @Expose()
  @IsString()
  @IsOptional()
  readonly release?: string;

  @Expose()
  @IsString()
  @IsOptional()
  readonly buildTime?: string;

  constructor(data: HttpHealthDto) {
    Object.assign(this, data);
  }

  static fromDomain(data: IHttpHealthDto): HttpHealthDto {
    return new HttpHealthDto(data);
  }
}

export interface IHttpHealthDto extends HttpHealthDto {}
