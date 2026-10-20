import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module.js';
import { BoardsModule } from './boards/boards.module.js';
import { databaseConfig } from './database/database.config.js';
import { KikopardyModule } from './kikopardy/kikopardy.module.js';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({ useFactory: databaseConfig }),
    AuthModule,
    BoardsModule,
    KikopardyModule,
  ],
})
export class AppModule {}
