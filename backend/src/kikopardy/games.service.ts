import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomInt } from 'node:crypto';
import { Repository } from 'typeorm';
import { BoardsService } from '../boards/boards.service.js';
import { GameEntity } from './game.entity.js';
import { GameRoom } from './game-room.js';
import type {
  BoardInput,
  GameDetail,
  GameStatus,
  GameSummary,
} from './kikopardy.contract.js';

// Without easily confused characters like 0/O and 1/I.
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const CODE_LENGTH = 5;

/** Keeps running games in memory and saves them to the database. */
@Injectable()
export class GamesService {
  private readonly logger = new Logger(GamesService.name);
  private readonly rooms = new Map<string, GameRoom>();
  /** Saves per game run one after another, so an older state never overwrites a newer one. */
  private readonly saveQueues = new Map<string, Promise<void>>();

  constructor(
    @InjectRepository(GameEntity)
    private readonly games: Repository<GameEntity>,
    private readonly boards: BoardsService,
  ) {}

  async start(boardId: string): Promise<GameSummary> {
    const board = await this.boards.get(boardId);
    const entity = await this.games.save(
      this.games.create({
        code: await this.generateCode(),
        status: 'running',
        boardId: board.id,
        board: { name: board.name, categories: board.categories },
        players: [],
        playedQuestions: [],
        endedAt: null,
      }),
    );
    const room = new GameRoom(entity);
    this.rooms.set(room.code, room);
    return toSummary(entity);
  }

  /** Returns a running game by join code. After a restart, the game is loaded from the database. */
  async getRoom(code: string): Promise<GameRoom | undefined> {
    const normalized = code.trim().toUpperCase();
    const cached = this.rooms.get(normalized);
    if (cached) {
      return cached;
    }
    const entity = await this.games.findOneBy({
      code: normalized,
      status: 'running',
    });
    if (!entity) {
      return undefined;
    }
    const room = new GameRoom(entity);
    this.rooms.set(room.code, room);
    return room;
  }

  save(room: GameRoom): Promise<void> {
    const snapshot = room.snapshot();
    if (room.isFinished) {
      this.rooms.delete(room.code);
    }
    const previous = this.saveQueues.get(room.id) ?? Promise.resolve();
    const next = previous
      .then(() =>
        this.games.update(snapshot.id, {
          status: snapshot.status,
          players: snapshot.players,
          playedQuestions: snapshot.playedQuestions,
          ...(room.isFinished ? { endedAt: new Date() } : {}),
        }),
      )
      .then(() => undefined)
      .catch((error: unknown) =>
        this.logger.error(`Saving game ${room.code} failed`, error),
      );
    this.saveQueues.set(room.id, next);
    void next.finally(() => {
      if (this.saveQueues.get(room.id) === next) {
        this.saveQueues.delete(room.id);
      }
    });
    return next;
  }

  async list(status?: GameStatus): Promise<GameSummary[]> {
    const games = await this.games.find({
      where: status ? { status } : {},
      order: { startedAt: 'DESC' },
    });
    return games.map((game) => this.withLivePlayers(toSummary(game)));
  }

  async get(id: string): Promise<GameDetail> {
    const game = await this.findEntity(id);
    // This route is public, so answers and Secret Doubles of a game that is still running stay hidden.
    const board: BoardInput =
      game.status === 'finished'
        ? game.board
        : {
            name: game.board.name,
            categories: game.board.categories.map((category) => ({
              ...category,
              questions: category.questions.map((q) => ({
                ...q,
                answer: '',
                answerMedia: null,
                double: false,
              })),
            })),
          };
    return {
      ...this.withLivePlayers(toSummary(game)),
      board,
      playedQuestions: game.playedQuestions,
    };
  }

  async remove(id: string): Promise<GameRoom | undefined> {
    const game = await this.findEntity(id);
    await this.games.delete(game.id);
    const room = this.rooms.get(game.code);
    if (room?.id === game.id) {
      this.rooms.delete(game.code);
      return room;
    }
    return undefined;
  }

  private withLivePlayers(summary: GameSummary): GameSummary {
    const room = this.rooms.get(summary.code);
    return room?.id === summary.id
      ? { ...summary, players: room.snapshot().players }
      : summary;
  }

  private async findEntity(id: string): Promise<GameEntity> {
    const game = await this.games.findOneBy({ id });
    if (!game) {
      throw new NotFoundException('Game not found');
    }
    return game;
  }

  private async generateCode(): Promise<string> {
    for (;;) {
      const code = Array.from(
        { length: CODE_LENGTH },
        () => CODE_ALPHABET[randomInt(CODE_ALPHABET.length)],
      ).join('');
      if (!(await this.games.existsBy({ code, status: 'running' }))) {
        return code;
      }
    }
  }
}

function toSummary(game: GameEntity): GameSummary {
  const players = game.players.map((p) => ({ ...p, connected: false }));
  const topScore = Math.max(...players.map((p) => p.score));
  return {
    id: game.id,
    code: game.code,
    status: game.status,
    boardName: game.board.name,
    startedAt: game.startedAt.toISOString(),
    endedAt: game.endedAt?.toISOString() ?? null,
    players,
    winnerNames:
      game.status === 'finished' && players.length > 0
        ? players.filter((p) => p.score === topScore).map((p) => p.name)
        : [],
  };
}
