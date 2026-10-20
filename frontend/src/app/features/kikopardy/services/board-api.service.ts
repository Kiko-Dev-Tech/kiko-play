import { HttpClient } from '@angular/common/http';
import { Service, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import type { Board, BoardInput, BoardSummary } from '../kikopardy.contract';

/** Admin REST calls for boards. */
@Service()
export class BoardApiService {
  private readonly http = inject(HttpClient);

  list(): Promise<BoardSummary[]> {
    return firstValueFrom(this.http.get<BoardSummary[]>('/api/boards'));
  }

  get(id: string): Promise<Board> {
    return firstValueFrom(this.http.get<Board>(`/api/boards/${id}`));
  }

  create(board: BoardInput): Promise<Board> {
    return firstValueFrom(this.http.post<Board>('/api/boards', board));
  }

  update(id: string, board: BoardInput): Promise<Board> {
    return firstValueFrom(this.http.put<Board>(`/api/boards/${id}`, board));
  }

  duplicate(id: string): Promise<Board> {
    return firstValueFrom(this.http.post<Board>(`/api/boards/${id}/duplicate`, null));
  }

  remove(id: string): Promise<void> {
    return firstValueFrom(this.http.delete<void>(`/api/boards/${id}`));
  }
}
