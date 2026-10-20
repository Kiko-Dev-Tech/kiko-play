import { Service, effect, inject, signal } from '@angular/core';
import { AdminAuthService } from '../../../core/admin-auth.service';
import { httpErrorMessage } from '../../../core/http-error';
import type { BoardSummary, GameSummary } from '../kikopardy.contract';
import { BoardApiService } from './board-api.service';
import { GameApiService } from './game-api.service';

/** State of the Kikopardy lobby: admin login, boards and running games. */
@Service({ autoProvided: false })
export class LobbyService {
  private readonly auth = inject(AdminAuthService);
  private readonly boardApi = inject(BoardApiService);
  private readonly gameApi = inject(GameApiService);

  private readonly _boards = signal<BoardSummary[]>([]);
  private readonly _runningGames = signal<GameSummary[]>([]);
  private readonly _busy = signal(false);
  private readonly _error = signal<string | null>(null);
  private readonly _loginError = signal<string | null>(null);

  readonly isAdmin = this.auth.isAdmin;
  readonly boards = this._boards.asReadonly();
  readonly runningGames = this._runningGames.asReadonly();
  readonly busy = this._busy.asReadonly();
  readonly error = this._error.asReadonly();
  readonly loginError = this._loginError.asReadonly();

  constructor() {
    // Load the admin data whenever someone is (or becomes) logged in.
    effect(() => {
      if (this.isAdmin()) {
        void this.refresh();
      }
    });
  }

  async login(password: string): Promise<void> {
    this._busy.set(true);
    this._loginError.set(null);
    try {
      await this.auth.login(password);
    } catch (error) {
      this._loginError.set(httpErrorMessage(error, 'Login failed'));
    } finally {
      this._busy.set(false);
    }
  }

  logout(): void {
    this.auth.logout();
    this._boards.set([]);
    this._runningGames.set([]);
  }

  async refresh(): Promise<void> {
    await this.run(async () => {
      const [boards, games] = await Promise.all([
        this.boardApi.list(),
        this.gameApi.list('running'),
      ]);
      this._boards.set(boards);
      this._runningGames.set(games);
    });
  }

  /** Starts a game and returns its join code. */
  async startGame(boardId: string): Promise<string | null> {
    let code: string | null = null;
    await this.run(async () => {
      code = (await this.gameApi.start(boardId)).code;
    });
    return code;
  }

  async duplicateBoard(id: string): Promise<void> {
    await this.run(async () => {
      await this.boardApi.duplicate(id);
      this._boards.set(await this.boardApi.list());
    });
  }

  async removeBoard(id: string): Promise<void> {
    await this.run(async () => {
      await this.boardApi.remove(id);
      this._boards.update((boards) => boards.filter((b) => b.id !== id));
    });
  }

  clearError(): void {
    this._error.set(null);
  }

  private async run(action: () => Promise<void>): Promise<void> {
    this._error.set(null);
    try {
      await action();
    } catch (error) {
      this._error.set(httpErrorMessage(error));
    }
  }
}
