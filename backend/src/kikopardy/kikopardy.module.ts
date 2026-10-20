import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BoardsModule } from '../boards/boards.module.js';
import { GameEntity } from './game.entity.js';
import { GamesController } from './games.controller.js';
import { GamesService } from './games.service.js';
import { KikopardyGateway } from './kikopardy.gateway.js';

@Module({
  imports: [TypeOrmModule.forFeature([GameEntity]), BoardsModule],
  controllers: [GamesController],
  providers: [GamesService, KikopardyGateway],
})
export class KikopardyModule {}
