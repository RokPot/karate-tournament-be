import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSourceOptions } from 'typeorm';

import { getConfigFactory } from '~common/config';
import { LoggerService } from '~common/logger';

import { DatabaseConfig } from './database.config';

@Global()
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [DatabaseConfig, LoggerService],
      useFactory: (config: DatabaseConfig, logger: LoggerService) => {
        const options: DataSourceOptions = {
          type: 'postgres',
          url: config.connectionUrl,
          ssl: config.ssl ? { rejectUnauthorized: false } : false,
          synchronize: config.synchronize ?? false,
          logging: config.logging ?? false,
          entities: [config.entities ?? 'dist/**/*.entity.js'],
          migrations: [config.migrations ?? 'dist/database/migrations/*.js'],
          migrationsTableName: config.migrationsTableName ?? 'migrations',
          migrationsRun: config.autoMigrate ?? false,
        };

        if (config.url) {
          logger.log(`Connecting to database via URL`);
        } else {
          logger.log(`Connecting to database: ${config.host}:${config.port}/${config.database}`);
        }

        return options;
      },
    }),
  ],
  providers: [getConfigFactory(DatabaseConfig)],
  exports: [TypeOrmModule, DatabaseConfig],
})
export class DatabaseModule {}
