import { DatePipe } from '@angular/common';
import { Component, input, output } from '@angular/core';
import type { GameSummary } from '../kikopardy.contract';

/** Running games (to resume) or finished games (history). */
@Component({
  selector: 'ui-game-list',
  imports: [DatePipe],
  template: `
    @if (games().length === 0) {
      <p class="text-slate-300">{{ emptyText() }}</p>
    } @else {
      <ul class="flex flex-col gap-2">
        @for (game of games(); track game.id) {
          <li
            class="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-stage-700 bg-stage-950/50 px-4 py-3"
          >
            <div>
              <p class="font-semibold text-white">
                {{ game.boardName }}
                @if (game.status === 'running') {
                  <span
                    class="ml-2 rounded bg-stage-700 px-2 py-0.5 font-mono text-sm text-gold-300"
                  >
                    {{ game.code }}
                  </span>
                }
              </p>
              <p class="text-sm text-slate-300">
                {{ game.startedAt | date: 'medium' }} · {{ game.players.length }} players
                @if (game.winnerNames.length) {
                  · <span class="text-gold-300">🏆 {{ game.winnerNames.join(', ') }}</span>
                }
              </p>
            </div>
            <div class="flex flex-wrap gap-2">
              <button type="button" class="btn btn-secondary btn-sm" (click)="open.emit(game)">
                {{ openLabel() }}
              </button>
              @if (removable()) {
                <button
                  type="button"
                  class="btn btn-ghost btn-sm text-rose-300"
                  (click)="remove.emit(game)"
                >
                  Delete
                </button>
              }
            </div>
          </li>
        }
      </ul>
    }
  `,
})
export class UiGameList {
  readonly games = input.required<GameSummary[]>();
  readonly emptyText = input('No games yet.');
  readonly openLabel = input('Open');
  readonly removable = input(false);
  readonly open = output<GameSummary>();
  readonly remove = output<GameSummary>();
}
