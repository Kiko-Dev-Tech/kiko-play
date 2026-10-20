import { Component, computed, input, output } from '@angular/core';
import type { GamePlayer, Guess } from '../kikopardy.contract';

interface GuessRow {
  playerId: string;
  name: string;
  text: string;
  winner: boolean;
}

/** All guesses of a guess question. The host can give the points to one of them. */
@Component({
  selector: 'ui-guess-list',
  template: `
    <section class="card flex flex-col gap-3 p-4" aria-labelledby="guess-list-heading">
      <h2 id="guess-list-heading" class="text-lg font-bold text-gold-300">Guesses</h2>
      @if (rows().length === 0) {
        <p class="text-sm text-slate-300">No guesses yet.</p>
      }
      <ul class="flex flex-col gap-2" aria-live="polite">
        @for (row of rows(); track row.playerId) {
          <li
            class="flex flex-wrap items-center justify-between gap-2 rounded-lg px-3 py-2"
            [class]="row.winner ? 'bg-emerald-500/20 ring-2 ring-emerald-400' : 'bg-stage-950/50'"
          >
            <span class="min-w-0">
              <span class="block text-sm text-slate-300">
                {{ row.name }}
                @if (row.winner) {
                  <span class="font-semibold text-emerald-300">· +{{ value() }}</span>
                }
              </span>
              <span class="block text-lg font-semibold break-words text-white">{{ row.text }}</span>
            </span>
            @if (canAward()) {
              <button
                type="button"
                class="btn btn-success btn-sm"
                [attr.aria-label]="'Give ' + value() + ' points to ' + row.name"
                (click)="awarded.emit(row.playerId)"
              >
                Give +{{ value() }}
              </button>
            }
          </li>
        }
      </ul>
    </section>
  `,
})
export class UiGuessList {
  readonly guesses = input.required<Guess[]>();
  readonly players = input.required<GamePlayer[]>();
  readonly value = input(0);
  readonly winnerId = input<string | null>(null);
  readonly canAward = input(false);
  readonly awarded = output<string>();

  protected readonly rows = computed<GuessRow[]>(() => {
    const names = new Map(this.players().map((p) => [p.id, p.name]));
    return this.guesses().map((g) => ({
      playerId: g.playerId,
      name: names.get(g.playerId) ?? 'Unknown player',
      text: g.text,
      winner: g.playerId === this.winnerId(),
    }));
  });
}
