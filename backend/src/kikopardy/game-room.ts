import type {
  BoardInput,
  CurrentQuestionView,
  GamePlayer,
  GameStatus,
  GameView,
  Guess,
  PlayedQuestion,
  Question,
} from './kikopardy.contract.js';

const MAX_GUESS_LENGTH = 200;

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
  questionRevealed: boolean;
  answerRevealed: boolean;
  results: PlayedQuestion['results'];
  guessingOpen: boolean;
  /** Guesses by player ID, in the order they were first submitted. */
  guesses: Map<string, string>;
  guessWinnerId: string | null;
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

  playerIds(): string[] {
    return [...this.players.keys()];
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
    if (!current || !this.players.has(playerId) || isGuess(current)) {
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

  /** Submits or changes a guess while guessing is open. An empty text withdraws it. */
  guess(playerId: string, rawText: string): void {
    this.assertRunning();
    const current = this.current;
    if (!current || !isGuess(current) || !this.players.has(playerId)) {
      throw new GameError('There is nothing to guess');
    }
    if (!current.guessingOpen) {
      throw new GameError('Guessing is closed');
    }
    const text = rawText.trim().slice(0, MAX_GUESS_LENGTH);
    if (text) {
      current.guesses.set(playerId, text);
    } else {
      current.guesses.delete(playerId);
    }
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
          questionRevealed: false,
          answerRevealed: false,
          results: [],
          guessingOpen: false,
          guesses: new Map(),
          guessWinnerId: null,
        };
        return;
      }
    }
    throw new GameError('Question not found');
  }

  /** Opening the buzzers also shows the question to the players. It stays visible when they are locked again. */
  setBuzzersOpen(open: boolean): void {
    const current = this.requireCurrent();
    if (isGuess(current)) {
      throw new GameError('This is a guess question');
    }
    if (open && current.buzzedPlayerId) {
      throw new GameError(
        'A player has buzzed already. Judge the answer first.',
      );
    }
    current.buzzersOpen = open;
    if (open) {
      current.questionRevealed = true;
    }
  }

  /** Scores the buzzed player. A correct answer closes the question, a wrong one reopens the buzzers for the others. */
  judge(correct: boolean): void {
    const current = this.requireCurrent();
    if (isGuess(current)) {
      throw new GameError('This is a guess question');
    }
    const player = current.buzzedPlayerId
      ? this.players.get(current.buzzedPlayerId)
      : undefined;
    if (!player) {
      throw new GameError('Nobody has buzzed');
    }
    const delta = correct ? points(current) : -points(current);
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

  /** Opening guessing also shows the question to the players, like opening the buzzers. */
  setGuessingOpen(open: boolean): void {
    const current = this.requireCurrent();
    if (!isGuess(current)) {
      throw new GameError('This is not a guess question');
    }
    if (open && current.answerRevealed) {
      throw new GameError('The answer is already revealed');
    }
    current.guessingOpen = open;
    if (open) {
      current.questionRevealed = true;
    }
  }

  /** Gives the question's points to the player with the best guess and closes the question. */
  awardGuess(playerId: string): void {
    const current = this.requireCurrent();
    if (!isGuess(current)) {
      throw new GameError('This is not a guess question');
    }
    const player = this.players.get(playerId);
    if (!player || !current.guesses.has(playerId)) {
      throw new GameError('This player has not guessed');
    }
    if (current.guessWinnerId) {
      throw new GameError('The points have already been given');
    }
    player.score += points(current);
    current.results.push({ playerId, correct: true, delta: points(current) });
    current.guessWinnerId = playerId;
    this.closeCurrent();
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
    const current = this.requireCurrent();
    current.questionRevealed = true;
    current.answerRevealed = true;
    current.guessingOpen = false;
  }

  backToBoard(): void {
    this.assertRunning();
    // A question that already cost or earned points, or got guesses, counts as played even if it was never closed.
    if (this.current?.results.length || this.current?.guesses.size) {
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

  /**
   * The state for one client. Players only see the answer once it has been revealed,
   * and only their own guess (`viewerId`) until then.
   */
  view(forAdmin: boolean, viewerId?: string): GameView {
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
          ...(forAdmin && q.double ? { double: true } : {}),
        })),
      })),
      players: [...this.players.values()].map((p) => ({ ...p })),
      current: this.current
        ? this.currentView(this.current, forAdmin, viewerId)
        : null,
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
    viewerId: string | undefined,
  ): CurrentQuestionView {
    const { id, value, question, questionMedia, answer, answerMedia } =
      current.question;
    const showQuestion = forAdmin || current.questionRevealed;
    const showAnswer = forAdmin || current.answerRevealed;
    const guesses = toGuesses(current.guesses).filter(
      (g) => showAnswer || g.playerId === viewerId,
    );
    return {
      question: {
        id,
        type: current.question.type ?? 'buzzer',
        // Revealed to everyone as soon as the question is picked.
        double: current.question.double === true,
        points: points(current),
        value,
        categoryName: current.categoryName,
        ...(showQuestion ? { question, questionMedia } : {}),
        ...(showAnswer ? { answer, answerMedia } : {}),
      },
      questionRevealed: current.questionRevealed,
      buzzersOpen: current.buzzersOpen,
      buzzedPlayerId: current.buzzedPlayerId,
      triedPlayerIds: [...current.triedPlayerIds],
      answerRevealed: current.answerRevealed,
      guessingOpen: current.guessingOpen,
      guessedPlayerIds: [...current.guesses.keys()],
      guesses,
      guessWinnerId: current.guessWinnerId,
    };
  }

  private closeCurrent(): void {
    const current = this.requireCurrent();
    current.buzzersOpen = false;
    current.buzzedPlayerId = null;
    current.guessingOpen = false;
    current.questionRevealed = true;
    current.answerRevealed = true;
    const previous = this.played.get(current.question.id);
    this.played.set(current.question.id, {
      questionId: current.question.id,
      results: [...(previous?.results ?? []), ...current.results],
      ...(isGuess(current) ? { guesses: toGuesses(current.guesses) } : {}),
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

/** A Secret Double is worth twice its value, for right and wrong answers. */
function points(current: CurrentQuestion): number {
  return current.question.double
    ? current.question.value * 2
    : current.question.value;
}

function isGuess(current: CurrentQuestion): boolean {
  return current.question.type === 'guess';
}

function toGuesses(guesses: Map<string, string>): Guess[] {
  return [...guesses].map(([playerId, text]) => ({ playerId, text }));
}
