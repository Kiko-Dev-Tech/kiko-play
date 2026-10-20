import { DatePipe } from '@angular/common';
import { Component, effect, inject, input, untracked } from '@angular/core';
import { UiErrorMessage } from '../../../shared/ui/ui-error-message';
import { UiPageHeader } from '../../../shared/ui/ui-page-header';
import { HistoryService } from '../services/history.service';
import { UiPlayedQuestionList } from '../ui/ui-played-question-list';
import { UiScoreboard } from '../ui/ui-scoreboard';

@Component({
  selector: 'page-kikopardy-game-detail',
  imports: [DatePipe, UiPageHeader, UiErrorMessage, UiScoreboard, UiPlayedQuestionList],
  providers: [HistoryService],
  template: `
    <ui-error-message [message]="history.error()" class="mb-4 block" />
    @if (history.detail(); as game) {
      <ui-page-header
        [title]="game.boardName"
        [subtitle]="
          (game.startedAt | date: 'medium') +
          (game.winnerNames.length ? ' · Winner: ' + game.winnerNames.join(', ') : '')
        "
        backLink="/kikopardy/history"
        backLabel="Game history"
      />
      <div
        class="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(18rem,1fr)]"
      >
        <section aria-labelledby="played-heading">
          <h2 id="played-heading" class="mb-3 text-lg font-bold text-gold-300">Played questions</h2>
          <ui-played-question-list [game]="game" />
        </section>
        <aside>
          <ui-scoreboard [players]="game.players" />
        </aside>
      </div>
    } @else if (history.loading()) {
      <p role="status" class="text-slate-300">Loading…</p>
    }
  `,
})
export class PageKikopardyGameDetail {
  /** Route param. */
  readonly id = input.required<string>();

  protected readonly history = inject(HistoryService);

  constructor() {
    effect(() => {
      const id = this.id();
      untracked(() => void this.history.loadDetail(id));
    });
  }
}
