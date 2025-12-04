# Database Module (TypeORM + PostgreSQL)

This module provides TypeORM integration with PostgreSQL for the tournament application.

## Configuration

Database configuration is managed through the YAML config files in `.config/` directory.

### Local Development

```yaml
database:
  host: localhost
  port: 5432
  database: tournament-app
  username: admin
  password: admin
  ssl: false
  synchronize: false
  autoMigrate: false
  logging: true
```

### Production/Staging

```yaml
database:
  url: ${env:DATABASE_URL}  # Full connection string
  ssl: true
  synchronize: false
  autoMigrate: true
  logging: false
```

## Usage

The `DatabaseModule` is global and automatically available throughout the application.

### Creating Entities

Create entity files with the `.entity.ts` extension:

```typescript
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  email: string;

  @Column()
  name: string;
}
```

### Using in Services

```typescript
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async findAll(): Promise<User[]> {
    return this.userRepository.find();
  }
}
```

### Using in Modules

```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.entity';
import { UserService } from './user.service';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  providers: [UserService],
})
export class UserModule {}
```

## Migrations

TypeORM migrations are configured to run from `dist/database/migrations/*.js`.

To create a migration:
```bash
yarn typeorm migration:create src/database/migrations/MigrationName
```

To run migrations:
```bash
yarn typeorm migration:run -d dist/database/data-source.js
```

Or set `autoMigrate: true` in config to run migrations automatically on startup.

## Important Notes

- **Never set `synchronize: true` in production** - it can cause data loss
- Use migrations for schema changes in production
- The `url` config option takes precedence over individual connection parameters

