import { Component, computed, input, output } from '@angular/core';
import type { GamePlayer } from '../kikopardy.contract';
import { UiScoreEditor } from './ui-score-editor';

export interface ScoreChange {
  playerId: string;
  score: number;
}

/** All players sorted by score. The host can edit scores at any time. */
@Component({
  selector: 'ui-scoreboard',
  imports: [UiScoreEditor],
  template: `
    <section aria-labelledby="scoreboard-heading" class="card p-4">
      <h2 id="scoreboard-heading" class="mb-3 text-lg font-bold text-gold-300">Scores</h2>
      @if (sorted().length === 0) {
        <p class="text-sm text-slate-300">Waiting for players to join…</p>
      }
      <ol class="flex flex-col gap-2">
        @for (player of sorted(); track player.id) {
          <li
            class="flex flex-wrap items-center justify-between gap-2 rounded-lg px-3 py-2"
            [class]="rowClass(player)"
          >
            <span class="flex min-w-0 items-center gap-2">
              <span
                class="size-2.5 shrink-0 rounded-full"
                [class]="player.connected ? 'bg-emerald-400' : 'bg-slate-500'"
                [attr.title]="player.connected ? 'Online' : 'Offline'"
              ></span>
              <span class="truncate font-semibold">
                {{ player.name }}
                @if (player.id === myId()) {
                  <span class="text-sm font-normal text-slate-300">(you)</span>
                }
              </span>
              <span class="sr-only">{{ player.connected ? 'online' : 'offline' }}</span>
              @if (player.id === buzzedPlayerId()) {
                <span class="rounded bg-gold-400 px-1.5 text-xs font-bold text-stage-950 uppercase"
                  >Buzzed</span
                >
              }
            </span>
            @if (editable()) {
              <ui-score-editor
                [score]="player.score"
                [playerName]="player.name"
                [step]="step()"
                (changed)="scoreChanged.emit({ playerId: player.id, score: $event })"
              />
            } @else {
              <span
                class="font-mono text-lg font-bold"
                [class]="player.score < 0 ? 'text-rose-300' : 'text-gold-300'"
              >
                {{ player.score }}
              </span>
            }
          </li>
        }
      </ol>
    </section>
  `,
})
export class UiScoreboard {
  readonly players = input.required<GamePlayer[]>();
  readonly myId = input<string>();
  readonly buzzedPlayerId = input<string | null>(null);
  readonly editable = input(false);
  /** The amount the +/- buttons change a score by. */
  readonly step = input(100);
  readonly scoreChanged = output<ScoreChange>();

  protected readonly sorted = computed(() =>
    [...this.players()].sort((a, b) => b.score - a.score || a.name.localeCompare(b.name)),
  );

  protected rowClass(player: GamePlayer): string {
    if (player.id === this.buzzedPlayerId()) {
      return 'bg-gold-400/20 ring-2 ring-gold-400';
    }
    return player.id === this.myId() ? 'bg-stage-700' : 'bg-stage-950/50';
  }
}
