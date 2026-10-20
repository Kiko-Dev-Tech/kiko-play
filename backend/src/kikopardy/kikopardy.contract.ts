// Shared Kikopardy contract between backend and frontend.
// Identical copies live in backend/src/kikopardy/ and frontend/src/app/features/kikopardy/.
// Change both files together (`npm run check:contract` in the backend compares them).

// ---------- Boards ----------

export type Media =
  | { type: 'youtube'; url: string; start?: number; end?: number }
  | { type: 'image'; url: string };

/**
 * `buzzer`: players buzz in and answer out loud.
 * `guess`: every player types a guess and the host gives the points to one of them.
 */
export type QuestionType = 'buzzer' | 'guess';

export interface Question {
  id: string;
  /** Missing on boards saved before guess questions existed, which means `buzzer`. */
  type?: QuestionType;
  value: number;
  /** Secret Double: worth twice the points. Players only learn it when the question is picked. */
  double?: boolean;
  question: string;
  answer: string;
  questionMedia?: Media | null;
  answerMedia?: Media | null;
}

export interface Category {
  id: string;
  name: string;
  questions: Question[];
}

export interface Board {
  id: string;
  name: string;
  categories: Category[];
  createdAt: string;
  updatedAt: string;
}

export interface BoardSummary {
  id: string;
  name: string;
  categoryCount: number;
  questionCount: number;
  updatedAt: string;
}

export type BoardInput = Pick<Board, 'name' | 'categories'>;

// ---------- Games ----------

export type GameStatus = 'running' | 'finished';

export interface GamePlayer {
  id: string;
  name: string;
  score: number;
  connected: boolean;
}

export interface AnswerResult {
  playerId: string;
  correct: boolean;
  delta: number;
}

export interface Guess {
  playerId: string;
  text: string;
}

export interface PlayedQuestion {
  questionId: string;
  results: AnswerResult[];
  /** All guesses of a guess question. */
  guesses?: Guess[];
  closedAt: string;
}

/**
 * A question as players see it. The question text and media are only included once the
 * buzzers (or guessing) have been opened, the answer only once it has been revealed.
 */
export interface QuestionView extends Pick<Question, 'id' | 'value'> {
  type: QuestionType;
  double: boolean;
  /** What a correct answer is worth: the value, doubled for a Secret Double. */
  points: number;
  categoryName: string;
  question?: string;
  questionMedia?: Media | null;
  answer?: string;
  answerMedia?: Media | null;
}

export interface CurrentQuestionView {
  question: QuestionView;
  /** Players see the question from the moment the buzzers open, so the host can read it out first. */
  questionRevealed: boolean;
  buzzersOpen: boolean;
  buzzedPlayerId: string | null;
  triedPlayerIds: string[];
  answerRevealed: boolean;
  /** Guess questions: whether players can submit or change their guess. */
  guessingOpen: boolean;
  /** Who has submitted a guess. Everyone sees this. */
  guessedPlayerIds: string[];
  /** The host sees all guesses, a player only their own until the answer is revealed. */
  guesses: Guess[];
  guessWinnerId: string | null;
}

export interface BoardCellView {
  id: string;
  value: number;
  played: boolean;
  /** Only sent to the host, so players can't spot the Secret Doubles on the board. */
  double?: boolean;
}

export interface GameView {
  gameId: string;
  code: string;
  status: GameStatus;
  boardName: string;
  categories: { id: string; name: string; cells: BoardCellView[] }[];
  players: GamePlayer[];
  current: CurrentQuestionView | null;
}

export interface GameSummary {
  id: string;
  code: string;
  status: GameStatus;
  boardName: string;
  startedAt: string;
  endedAt: string | null;
  players: GamePlayer[];
  winnerNames: string[];
}

export interface GameDetail extends GameSummary {
  board: BoardInput;
  playedQuestions: PlayedQuestion[];
}

// ---------- Socket events ----------

export const SocketEvents = {
  // client -> server
  join: 'game:join',
  host: 'game:host',
  buzz: 'player:buzz',
  guess: 'player:guess',
  selectQuestion: 'admin:selectQuestion',
  openBuzzers: 'admin:openBuzzers',
  lockBuzzers: 'admin:lockBuzzers',
  judge: 'admin:judge',
  openGuessing: 'admin:openGuessing',
  lockGuessing: 'admin:lockGuessing',
  awardGuess: 'admin:awardGuess',
  unlockPlayers: 'admin:unlockPlayers',
  skip: 'admin:skip',
  revealAnswer: 'admin:revealAnswer',
  backToBoard: 'admin:backToBoard',
  setScore: 'admin:setScore',
  setPlayed: 'admin:setPlayed',
  endGame: 'admin:endGame',
  // server -> client
  state: 'game:state',
  ended: 'game:ended',
} as const;

export interface JoinPayload {
  code: string;
  playerId: string;
  name: string;
}

export interface HostPayload {
  code: string;
}

export interface SelectQuestionPayload {
  questionId: string;
}

export interface JudgePayload {
  correct: boolean;
}

/** An empty text withdraws the guess. */
export interface GuessPayload {
  text: string;
}

export interface AwardGuessPayload {
  playerId: string;
}

export interface SetScorePayload {
  playerId: string;
  score: number;
}

export interface SetPlayedPayload {
  questionId: string;
  played: boolean;
}

/** Acknowledgement returned by every client -> server event. */
export type Ack = { ok: true } | { ok: false; error: string };
