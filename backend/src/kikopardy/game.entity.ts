import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';
import type {
  BoardInput,
  GamePlayer,
  GameStatus,
  PlayedQuestion,
} from './kikopardy.contract.js';

@Entity('game')
export class GameEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ length: 8 })
  code: string;

  @Column({ type: 'varchar', length: 16 })
  status: GameStatus;

  /** The board the game was started from. Not a foreign key, so boards can be deleted later. */
  @Column({ type: 'uuid', nullable: true })
  boardId: string | null;

  /** A copy of the board at game start, so later board edits don't change old games. */
  @Column({ type: 'jsonb' })
  board: BoardInput;

  @Column({ type: 'jsonb', default: [] })
  players: GamePlayer[];

  @Column({ type: 'jsonb', default: [] })
  playedQuestions: PlayedQuestion[];

  @CreateDateColumn({ type: 'timestamptz' })
  startedAt: Date;

  @Column({ type: 'timestamptz', nullable: true })
  endedAt: Date | null;
}
