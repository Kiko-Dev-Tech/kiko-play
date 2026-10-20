import type {
  BoardInput,
  CurrentQuestionView,
  GamePlayer,
  GameStatus,
  GameView,
  PlayedQuestion,
  Question,
} from './kikopardy.contract.js';

/** Everything that is saved to the database for a game. */
export interface GameSnapshot {
  id: string;
  code: string;
  status: GameStatus;
  board: BoardInput;
  players: GamePlayer[];
  playedQuestions: PlayedQuestion[];
}

interface CurrentQuestion {
  question: Question;
  categoryName: string;
  buzzersOpen: boolean;
  buzzedPlayerId: string | null;
  triedPlayerIds: Set<string>;
  answerRevealed: boolean;
  results: PlayedQuestion['results'];
}

export class GameError extends Error {}

/**
 * The state and rules of one running Kikopardy game.
 * Pure logic without I/O. Every method throws a GameError when the action is not allowed.
 */
export class GameRoom {
  readonly id: string;
  readonly code: string;
  private status: GameStatus;
  private readonly board: BoardInput;
  private readonly players = new Map<string, GamePlayer>();
  private readonly played = new Map<string, PlayedQuestion>();
  private current: CurrentQuestion | null = null;

  constructor(snapshot: GameSnapshot) {
    this.id = snapshot.id;
    this.code = snapshot.code;
    this.status = snapshot.status;
    this.board = snapshot.board;
    for (const player of snapshot.players) {
      // Nobody is connected when a game is loaded from the database.
      this.players.set(player.id, { ...player, connected: false });
    }
    for (const entry of snapshot.playedQuestions) {
      this.played.set(entry.questionId, entry);
    }
  }

  get isFinished(): boolean {
    return this.status === 'finished';
  }

  // ---------- Players ----------

  join(playerId: string, rawName: string): void {
    this.assertRunning();
    const name = rawName.trim();
    if (!name) {
      throw new GameError('Username is required');
    }
    const taken = [...this.players.values()].some(
      (p) => p.id !== playerId && p.name.toLowerCase() === name.toLowerCase(),
    );
    if (taken) {
      throw new GameError(`The name "${name}" is already taken in this game`);
    }
    const existing = this.players.get(playerId);
    if (existing) {
      existing.name = name;
      existing.connected = true;
    } else {
      this.players.set(playerId, {
        id: playerId,
        name,
        score: 0,
        connected: true,
      });
    }
  }

  setConnected(playerId: string, connected: boolean): void {
    const player = this.players.get(playerId);
    if (player) {
      player.connected = connected;
    }
  }

  buzz(playerId: string): void {
    this.assertRunning();
    const current = this.current;
    if (!current || !this.players.has(playerId)) {
      throw new GameError('There is nothing to buzz for');
    }
    if (!current.buzzersOpen || current.buzzedPlayerId) {
      throw new GameError('Buzzers are locked');
    }
    if (current.triedPlayerIds.has(playerId)) {
      throw new GameError('You already answered this question');
    }
    current.buzzedPlayerId = playerId;
    current.buzzersOpen = false;
  }

  // ---------- Admin actions ----------

  selectQuestion(questionId: string): void {
    this.assertRunning();
    for (const category of this.board.categories) {
      const question = category.questions.find((q) => q.id === questionId);
      if (question) {
        this.current = {
          question,
          categoryName: category.name,
          buzzersOpen: false,
          buzzedPlayerId: null,
          triedPlayerIds: new Set(),
          answerRevealed: false,
          results: [],
        };
        return;
      }
    }
    throw new GameError('Question not found');
  }

  setBuzzersOpen(open: boolean): void {
    const current = this.requireCurrent();
    if (open && current.buzzedPlayerId) {
      throw new GameError(
        'A player has buzzed already. Judge the answer first.',
      );
    }
    current.buzzersOpen = open;
  }

  /** Scores the buzzed player. A correct answer closes the question, a wrong one reopens the buzzers for the others. */
  judge(correct: boolean): void {
    const current = this.requireCurrent();
    const player = current.buzzedPlayerId
      ? this.players.get(current.buzzedPlayerId)
      : undefined;
    if (!player) {
      throw new GameError('Nobody has buzzed');
    }
    const delta = correct ? current.question.value : -current.question.value;
    player.score += delta;
    current.results.push({ playerId: player.id, correct, delta });
    current.buzzedPlayerId = null;
    if (correct) {
      this.closeCurrent();
    } else {
      current.triedPlayerIds.add(player.id);
      current.buzzersOpen = true;
    }
  }

  /** Lets players who already answered wrong buzz again on the current question. */
  unlockPlayers(): void {
    this.requireCurrent().triedPlayerIds.clear();
  }

  /** Closes the current question without awarding points. */
  skip(): void {
    this.requireCurrent();
    this.closeCurrent();
  }

  revealAnswer(): void {
    this.requireCurrent().answerRevealed = true;
  }

  backToBoard(): void {
    this.assertRunning();
    // A question that already cost or earned points counts as played, even if it was never closed.
    if (this.current?.results.length) {
      this.closeCurrent();
    }
    this.current = null;
  }

  setScore(playerId: string, score: number): void {
    this.assertRunning();
    const player = this.players.get(playerId);
    if (!player) {
      throw new GameError('Player not found');
    }
    if (!Number.isFinite(score)) {
      throw new GameError('Invalid score');
    }
    player.score = Math.round(score);
  }

  setPlayed(questionId: string, played: boolean): void {
    this.assertRunning();
    if (played) {
      if (!this.played.has(questionId)) {
        this.played.set(questionId, {
          questionId,
          results: [],
          closedAt: new Date().toISOString(),
        });
      }
    } else {
      this.played.delete(questionId);
    }
  }

  end(): void {
    this.assertRunning();
    this.current = null;
    this.status = 'finished';
  }

  // ---------- Views ----------

  /** The state for one client. Players only see the answer once it has been revealed. */
  view(forAdmin: boolean): GameView {
    return {
      gameId: this.id,
      code: this.code,
      status: this.status,
      boardName: this.board.name,
      categories: this.board.categories.map((category) => ({
        id: category.id,
        name: category.name,
        cells: category.questions.map((q) => ({
          id: q.id,
          value: q.value,
          played: this.played.has(q.id),
        })),
      })),
      players: [...this.players.values()].map((p) => ({ ...p })),
      current: this.current ? this.currentView(this.current, forAdmin) : null,
    };
  }

  snapshot(): GameSnapshot {
    return {
      id: this.id,
      code: this.code,
      status: this.status,
      board: this.board,
      players: [...this.players.values()].map((p) => ({ ...p })),
      playedQuestions: [...this.played.values()],
    };
  }

  // ---------- Helpers ----------

  private currentView(
    current: CurrentQuestion,
    forAdmin: boolean,
  ): CurrentQuestionView {
    const { answer, answerMedia, ...question } = current.question;
    const showAnswer = forAdmin || current.answerRevealed;
    return {
      question: {
        ...question,
        categoryName: current.categoryName,
        ...(showAnswer ? { answer, answerMedia } : {}),
      },
      buzzersOpen: current.buzzersOpen,
      buzzedPlayerId: current.buzzedPlayerId,
      triedPlayerIds: [...current.triedPlayerIds],
      answerRevealed: current.answerRevealed,
    };
  }

  private closeCurrent(): void {
    const current = this.requireCurrent();
    current.buzzersOpen = false;
    current.buzzedPlayerId = null;
    current.answerRevealed = true;
    const previous = this.played.get(current.question.id);
    this.played.set(current.question.id, {
      questionId: current.question.id,
      results: [...(previous?.results ?? []), ...current.results],
      closedAt: new Date().toISOString(),
    });
    current.results = [];
  }

  private requireCurrent(): CurrentQuestion {
    this.assertRunning();
    if (!this.current) {
      throw new GameError('No question is selected');
    }
    return this.current;
  }

  private assertRunning(): void {
    if (this.status !== 'running') {
      throw new GameError('This game has ended');
    }
  }
}
