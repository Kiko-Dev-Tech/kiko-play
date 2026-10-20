import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { GamePlayer } from '../kikopardy.contract';

@Component({
  selector: 'ui-game-ended',
  imports: [RouterLink],
  template: `
    <section class="card mx-auto max-w-xl text-center" aria-live="polite">
      <p class="text-5xl" aria-hidden="true">🏆</p>
      <h2 class="mt-3 font-display text-3xl tracking-wide text-gold-400 uppercase">Game over</h2>
      @if (winners().length) {
        <p class="mt-2 text-lg">
          {{ winners().length > 1 ? 'Winners' : 'Winner' }}:
          <strong class="text-gold-300">{{ winners().join(', ') }}</strong>
        </p>
      }
      <div class="mt-6 flex flex-wrap justify-center gap-2">
        <a routerLink="/kikopardy" class="btn btn-primary">Back to lobby</a>
        <a routerLink="/kikopardy/history" class="btn btn-secondary">Game history</a>
      </div>
    </section>
  `,
})
export class UiGameEnded {
  readonly players = input<GamePlayer[]>([]);

  protected readonly winners = computed(() => {
    const players = this.players();
    const top = Math.max(...players.map((p) => p.score));
    return players.filter((p) => p.score === top).map((p) => p.name);
  });
}
