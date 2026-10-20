import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { IsIn, IsOptional, IsUUID } from 'class-validator';
import { AdminGuard } from '../auth/admin.guard.js';
import { GamesService } from './games.service.js';
import type {
  GameDetail,
  GameStatus,
  GameSummary,
} from './kikopardy.contract.js';
import { KikopardyGateway } from './kikopardy.gateway.js';

class StartGameDto {
  @IsUUID()
  boardId: string;
}

class ListGamesQuery {
  @IsOptional()
  @IsIn(['running', 'finished'])
  status?: GameStatus;
}

@Controller('games')
export class GamesController {
  constructor(
    private readonly games: GamesService,
    private readonly gateway: KikopardyGateway,
  ) {}

  @Get()
  list(@Query() query: ListGamesQuery): Promise<GameSummary[]> {
    return this.games.list(query.status);
  }

  @Get(':id')
  get(@Param('id', ParseUUIDPipe) id: string): Promise<GameDetail> {
    return this.games.get(id);
  }

  @Post()
  @UseGuards(AdminGuard)
  start(@Body() body: StartGameDto): Promise<GameSummary> {
    return this.games.start(body.boardId);
  }

  @Delete(':id')
  @HttpCode(204)
  @UseGuards(AdminGuard)
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    const room = await this.games.remove(id);
    if (room) {
      this.gateway.closeRoom(room);
    }
  }
}
