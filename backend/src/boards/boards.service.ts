import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type {
  Board,
  BoardInput,
  BoardSummary,
} from '../kikopardy/kikopardy.contract.js';
import { BoardEntity } from './board.entity.js';

@Injectable()
export class BoardsService {
  constructor(
    @InjectRepository(BoardEntity)
    private readonly boards: Repository<BoardEntity>,
  ) {}

  async list(): Promise<BoardSummary[]> {
    const boards = await this.boards.find({ order: { updatedAt: 'DESC' } });
    return boards.map((board) => ({
      id: board.id,
      name: board.name,
      categoryCount: board.categories.length,
      questionCount: board.categories.reduce(
        (sum, c) => sum + c.questions.length,
        0,
      ),
      updatedAt: board.updatedAt.toISOString(),
    }));
  }

  async get(id: string): Promise<Board> {
    return toBoard(await this.findEntity(id));
  }

  async create(input: BoardInput): Promise<Board> {
    const board = this.boards.create({
      name: input.name,
      categories: input.categories,
    });
    return toBoard(await this.boards.save(board));
  }

  async update(id: string, input: BoardInput): Promise<Board> {
    const board = await this.findEntity(id);
    board.name = input.name;
    board.categories = input.categories;
    return toBoard(await this.boards.save(board));
  }

  async duplicate(id: string): Promise<Board> {
    const original = await this.findEntity(id);
    return this.create({
      name: `${original.name} (copy)`,
      categories: structuredClone(original.categories),
    });
  }

  async remove(id: string): Promise<void> {
    await this.boards.delete((await this.findEntity(id)).id);
  }

  private async findEntity(id: string): Promise<BoardEntity> {
    const board = await this.boards.findOneBy({ id });
    if (!board) {
      throw new NotFoundException('Board not found');
    }
    return board;
  }
}

function toBoard(entity: BoardEntity): Board {
  return {
    id: entity.id,
    name: entity.name,
    categories: entity.categories,
    createdAt: entity.createdAt.toISOString(),
    updatedAt: entity.updatedAt.toISOString(),
  };
}
