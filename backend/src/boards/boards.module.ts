import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BoardEntity } from './board.entity.js';
import { BoardsController } from './boards.controller.js';
import { BoardsService } from './boards.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([BoardEntity])],
  controllers: [BoardsController],
  providers: [BoardsService],
  exports: [BoardsService],
})
export class BoardsModule {}
