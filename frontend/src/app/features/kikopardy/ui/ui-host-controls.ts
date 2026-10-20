import { Component, input, output } from '@angular/core';
import type { CurrentQuestionView, GamePlayer } from '../kikopardy.contract';

export type HostAction =
  | 'openBuzzers'
  | 'lockBuzzers'
  | 'openGuessing'
  | 'lockGuessing'
  | 'correct'
  | 'wrong'
  | 'unlockPlayers'
  | 'skip'
  | 'reveal'
  | 'backToBoard';

/** Everything the host can do while a question is open. */
@Component({
  selector: 'ui-host-controls',
  template: `
    <section aria-labelledby="host-controls-heading" class="card flex flex-col gap-4 p-4">
      <h2 id="host-controls-heading" class="text-lg font-bold text-gold-300">Host controls</h2>

      @if (current().question.type === 'guess') {
        @if (!current().answerRevealed) {
          <p class="text-sm text-slate-300" aria-live="polite">
            Guessing is
            <strong class="text-white">{{ current().guessingOpen ? 'open' : 'closed' }}</strong>
            · {{ current().guessedPlayerIds.length }} of {{ playerCount() }} guessed. Give the
            points to the best guess below.
          </p>
          @if (current().guessingOpen) {
            <button type="button" class="btn btn-secondary" (click)="action.emit('lockGuessing')">
              Lock guessing
            </button>
          } @else {
            <button
              type="button"
              class="btn btn-primary py-3 text-lg"
              (click)="action.emit('openGuessing')"
            >
              {{ current().questionRevealed ? 'Reopen guessing' : 'Show question & open guessing' }}
            </button>
          }
        }
      } @else if (buzzedPlayer(); as player) {
        <div class="rounded-xl bg-gold-400/15 p-3 ring-2 ring-gold-400" aria-live="assertive">
          <p class="mb-3 text-center text-lg">
            <strong class="text-gold-300">{{ player.name }}</strong> buzzed. Is the answer correct?
          </p>
          <div class="grid grid-cols-2 gap-2">
            <button
              type="button"
              class="btn btn-success py-3 text-lg"
              (click)="action.emit('correct')"
            >
              ✓ Correct +{{ current().question.value }}
            </button>
            <button
              type="button"
              class="btn btn-danger py-3 text-lg"
              (click)="action.emit('wrong')"
            >
              ✕ Wrong −{{ current().question.value }}
            </button>
          </div>
        </div>
      } @else if (!current().answerRevealed) {
        <p class="text-sm text-slate-300" aria-live="polite">
          Buzzers are
          <strong class="text-white">{{ current().buzzersOpen ? 'open' : 'locked' }}</strong
          >.
          @if (triedNames().length) {
            Already tried: {{ triedNames().join(', ') }}.
          }
        </p>
        @if (current().buzzersOpen) {
          <button type="button" class="btn btn-secondary" (click)="action.emit('lockBuzzers')">
            Lock buzzers
          </button>
        } @else {
          <button
            type="button"
            class="btn btn-primary py-3 text-lg"
            (click)="action.emit('openBuzzers')"
          >
            {{ current().questionRevealed ? 'Open buzzers' : 'Show question & open buzzers' }}
          </button>
        }
      }

      <div class="flex flex-wrap gap-2">
        @if (current().triedPlayerIds.length && !current().answerRevealed) {
          <button
            type="button"
            class="btn btn-secondary btn-sm"
            (click)="action.emit('unlockPlayers')"
          >
            Unlock players who answered
          </button>
        }
        @if (!current().answerRevealed) {
          <button type="button" class="btn btn-secondary btn-sm" (click)="action.emit('reveal')">
            Reveal answer
          </button>
          <button type="button" class="btn btn-secondary btn-sm" (click)="action.emit('skip')">
            Skip (no points)
          </button>
        }
        <button type="button" class="btn btn-primary btn-sm" (click)="action.emit('backToBoard')">
          Back to board
        </button>
      </div>
    </section>
  `,
})
export class UiHostControls {
  readonly current = input.required<CurrentQuestionView>();
  readonly buzzedPlayer = input<GamePlayer | null>(null);
  readonly triedNames = input<string[]>([]);
  readonly playerCount = input(0);
  readonly action = output<HostAction>();
}
