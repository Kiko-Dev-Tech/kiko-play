import { HttpClient } from '@angular/common/http';
import { Service, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import type { GameDetail, GameStatus, GameSummary } from '../kikopardy.contract';

/** REST calls for starting games and reading the history. */
@Service()
export class GameApiService {
  private readonly http = inject(HttpClient);

  list(status?: GameStatus): Promise<GameSummary[]> {
    const params: Record<string, string> = status ? { status } : {};
    return firstValueFrom(this.http.get<GameSummary[]>('/api/games', { params }));
  }

  get(id: string): Promise<GameDetail> {
    return firstValueFrom(this.http.get<GameDetail>(`/api/games/${id}`));
  }

  start(boardId: string): Promise<GameSummary> {
    return firstValueFrom(this.http.post<GameSummary>('/api/games', { boardId }));
  }

  remove(id: string): Promise<void> {
    return firstValueFrom(this.http.delete<void>(`/api/games/${id}`));
  }
}
