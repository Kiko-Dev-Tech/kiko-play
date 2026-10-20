import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { AdminGuard } from '../auth/admin.guard.js';
import type { Board, BoardSummary } from '../kikopardy/kikopardy.contract.js';
import { BoardsService } from './boards.service.js';
import { BoardInputDto } from './dto/board-input.dto.js';

/** Boards contain the answers, so every route is admin only. */
@Controller('boards')
@UseGuards(AdminGuard)
export class BoardsController {
  constructor(private readonly boards: BoardsService) {}

  @Get()
  list(): Promise<BoardSummary[]> {
    return this.boards.list();
  }

  @Get(':id')
  get(@Param('id', ParseUUIDPipe) id: string): Promise<Board> {
    return this.boards.get(id);
  }

  @Post()
  create(@Body() body: BoardInputDto): Promise<Board> {
    return this.boards.create(body);
  }

  @Put(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: BoardInputDto,
  ): Promise<Board> {
    return this.boards.update(id, body);
  }

  @Post(':id/duplicate')
  duplicate(@Param('id', ParseUUIDPipe) id: string): Promise<Board> {
    return this.boards.duplicate(id);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.boards.remove(id);
  }
}
