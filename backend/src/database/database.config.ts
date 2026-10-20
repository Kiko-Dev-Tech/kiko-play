import type { DataSourceOptions } from 'typeorm';
import { BoardEntity } from '../boards/board.entity.js';
import { GameEntity } from '../kikopardy/game.entity.js';
import { InitialSchema1760950000000 } from './migrations/1760950000000-initial-schema.js';

/** Postgres connection from DATABASE_URL. Migrations run automatically on startup. */
export function databaseConfig(): DataSourceOptions {
  return {
    type: 'postgres',
    url: process.env.DATABASE_URL ?? 'postgres://kiko:kiko@localhost:5432/kiko',
    entities: [BoardEntity, GameEntity],
    migrations: [InitialSchema1760950000000],
    migrationsRun: true,
    synchronize: false,
  };
}
