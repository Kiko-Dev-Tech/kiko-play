import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'ui-game-card',
  imports: [RouterLink],
  template: `
    <a
      [routerLink]="link()"
      class="group flex h-full flex-col rounded-2xl border-2 border-stage-700 bg-gradient-to-br from-stage-800 to-stage-900 p-6 shadow-lg transition hover:-translate-y-1 hover:border-gold-400"
    >
      <span class="text-5xl" aria-hidden="true">{{ icon() }}</span>
      <h2 class="mt-4 font-display text-2xl tracking-wide text-gold-400 uppercase">{{ name() }}</h2>
      <p class="mt-2 text-slate-300">{{ description() }}</p>
      <span class="mt-auto pt-4 font-semibold text-gold-300 group-hover:underline">
        Play <span aria-hidden="true">→</span>
      </span>
    </a>
  `,
})
export class UiGameCard {
  readonly name = input.required<string>();
  readonly description = input.required<string>();
  readonly icon = input.required<string>();
  readonly link = input.required<string>();
}
