import { Service, inject, signal } from '@angular/core';
import { AdminAuthService } from '../../../core/admin-auth.service';
import { httpErrorMessage } from '../../../core/http-error';
import type { GameDetail, GameSummary } from '../kikopardy.contract';
import { GameApiService } from './game-api.service';

/** Finished games and the details of one of them. */
@Service({ autoProvided: false })
export class HistoryService {
  private readonly api = inject(GameApiService);

  private readonly _games = signal<GameSummary[]>([]);
  private readonly _detail = signal<GameDetail | null>(null);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);

  readonly isAdmin = inject(AdminAuthService).isAdmin;
  readonly games = this._games.asReadonly();
  readonly detail = this._detail.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  loadGames(): Promise<void> {
    return this.run(async () => this._games.set(await this.api.list('finished')));
  }

  loadDetail(id: string): Promise<void> {
    this._detail.set(null);
    return this.run(async () => this._detail.set(await this.api.get(id)));
  }

  remove(id: string): Promise<void> {
    return this.run(async () => {
      await this.api.remove(id);
      this._games.update((games) => games.filter((g) => g.id !== id));
    });
  }

  private async run(action: () => Promise<void>): Promise<void> {
    this._loading.set(true);
    this._error.set(null);
    try {
      await action();
    } catch (error) {
      this._error.set(httpErrorMessage(error));
    } finally {
      this._loading.set(false);
    }
  }
}
