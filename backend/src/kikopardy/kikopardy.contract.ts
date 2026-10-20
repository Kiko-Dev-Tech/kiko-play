// Shared Kikopardy contract between backend and frontend.
// Identical copies live in backend/src/kikopardy/ and frontend/src/app/features/kikopardy/.
// Change both files together (`npm run check:contract` in the backend compares them).

// ---------- Boards ----------

export type Media =
  | { type: 'youtube'; url: string; start?: number; end?: number }
  | { type: 'image'; url: string };

export interface Question {
  id: string;
  value: number;
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

export interface PlayedQuestion {
  questionId: string;
  results: AnswerResult[];
  closedAt: string;
}

/** A question as players see it. The answer is only included once it has been revealed. */
export interface QuestionView extends Omit<Question, 'answer' | 'answerMedia'> {
  categoryName: string;
  answer?: string;
  answerMedia?: Media | null;
}

export interface CurrentQuestionView {
  question: QuestionView;
  buzzersOpen: boolean;
  buzzedPlayerId: string | null;
  triedPlayerIds: string[];
  answerRevealed: boolean;
}

export interface BoardCellView {
  id: string;
  value: number;
  played: boolean;
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
  selectQuestion: 'admin:selectQuestion',
  openBuzzers: 'admin:openBuzzers',
  lockBuzzers: 'admin:lockBuzzers',
  judge: 'admin:judge',
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
