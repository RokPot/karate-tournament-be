import { Expose, Type } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, IsString, ValidateIf } from 'class-validator';

import { ConfigDecorator } from '~common/config';
import { TransformInputToBoolean } from '~common/validate';

@ConfigDecorator('database')
export class DatabaseConfig {
  /**
   * Database connection string
   * If provided, other connection parameters are ignored
   */
  @Expose()
  @IsOptional()
  @IsString()
  url?: string;

  /**
   * Database host
   */
  @Expose()
  @ValidateIf((o) => !o.url)
  @IsString()
  host!: string;

  /**
   * Database port
   */
  @Expose()
  @ValidateIf((o) => !o.url)
  @IsInt()
  @Type(() => Number)
  port!: number;

  /**
   * Database name
   */
  @Expose()
  @ValidateIf((o) => !o.url)
  @IsString()
  database!: string;

  /**
   * Database username
   */
  @Expose()
  @ValidateIf((o) => !o.url)
  @IsString()
  username!: string;

  /**
   * Database password
   */
  @Expose()
  @ValidateIf((o) => !o.url)
  @IsString()
  password!: string;

  /**
   * Enable SSL connection
   */
  @Expose()
  @IsOptional()
  @IsBoolean()
  @TransformInputToBoolean()
  ssl?: boolean = false;

  /**
   * Synchronize database schema automatically
   * WARNING: Set to false in production
   */
  @Expose()
  @IsOptional()
  @IsBoolean()
  @TransformInputToBoolean()
  synchronize?: boolean = false;

  /**
   * Run migrations automatically on startup
   */
  @Expose()
  @IsOptional()
  @IsBoolean()
  @TransformInputToBoolean()
  autoMigrate?: boolean = false;

  /**
   * Log SQL queries
   */
  @Expose()
  @IsOptional()
  @IsBoolean()
  @TransformInputToBoolean()
  logging?: boolean = false;

  /**
   * Entities directory path
   */
  @Expose()
  @IsOptional()
  @IsString()
  entities?: string = 'dist/**/*.entity.js';

  /**
   * Migrations directory path
   */
  @Expose()
  @IsOptional()
  @IsString()
  migrations?: string = 'dist/database/migrations/*.js';

  /**
   * Migrations table name
   */
  @Expose()
  @IsOptional()
  @IsString()
  migrationsTableName?: string = 'migrations';

  get connectionUrl(): string {
    if (this.url) {
      return this.url;
    }
    return `postgresql://${this.username}:${this.password}@${this.host}:${this.port}/${this.database}`;
  }
}
