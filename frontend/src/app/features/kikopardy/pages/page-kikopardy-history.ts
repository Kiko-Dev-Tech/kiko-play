import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { UiErrorMessage } from '../../../shared/ui/ui-error-message';
import { UiPageHeader } from '../../../shared/ui/ui-page-header';
import type { GameSummary } from '../kikopardy.contract';
import { HistoryService } from '../services/history.service';
import { UiGameList } from '../ui/ui-game-list';

@Component({
  selector: 'page-kikopardy-history',
  imports: [UiPageHeader, UiErrorMessage, UiGameList],
  providers: [HistoryService],
  template: `
    <ui-page-header
      title="Game history"
      subtitle="All finished Kikopardy games"
      backLink="/kikopardy"
      backLabel="Lobby"
    />
    <ui-error-message [message]="history.error()" class="mb-4 block" />
    @if (history.loading() && history.games().length === 0) {
      <p role="status" class="text-slate-300">Loading…</p>
    } @else {
      <ui-game-list
        [games]="history.games()"
        emptyText="No finished games yet."
        openLabel="Details"
        [removable]="history.isAdmin()"
        (open)="open($event)"
        (remove)="remove($event)"
      />
    }
  `,
})
export class PageKikopardyHistory {
  protected readonly history = inject(HistoryService);
  private readonly router = inject(Router);

  constructor() {
    void this.history.loadGames();
  }

  protected open(game: GameSummary): void {
    void this.router.navigate(['/kikopardy/history', game.id]);
  }

  protected remove(game: GameSummary): void {
    if (confirm(`Delete the game "${game.boardName}" from the history?`)) {
      void this.history.remove(game.id);
    }
  }
}
