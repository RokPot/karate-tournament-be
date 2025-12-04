import { resolve } from 'path';

import { config } from 'dotenv';
import { DataSource, type DataSourceOptions } from 'typeorm';

// Load environment variables
config({ path: resolve(__dirname, '../../.env') });

// This file is used by TypeORM CLI for migrations
// It reads from environment variables or uses defaults
const options: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'admin',
  password: process.env.DB_PASSWORD || 'admin',
  database: process.env.DB_DATABASE || 'tournament-app',
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  migrations: [__dirname + '/migrations/*{.ts,.js}'],
  migrationsTableName: 'migrations',
  synchronize: false,
  logging: process.env.NODE_ENV === 'development',
};

// If DATABASE_URL is provided, use it instead
if (process.env.DATABASE_URL) {
  (options as any).url = process.env.DATABASE_URL;
}

export default new DataSource(options);
