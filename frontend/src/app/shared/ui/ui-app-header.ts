import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'ui-app-header',
  imports: [RouterLink],
  template: `
    <header class="border-b border-stage-800 bg-stage-900/80">
      <div class="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <a routerLink="/games" class="font-display text-xl tracking-wider text-gold-400 uppercase">
          Kiko<span class="text-slate-100">Play</span>
        </a>
        @if (username()) {
          <a
            routerLink="/"
            [queryParams]="{ change: 1 }"
            class="rounded-lg px-2 py-1 text-sm text-slate-300 hover:bg-stage-800 hover:text-white"
          >
            Playing as <strong class="text-white">{{ username() }}</strong>
            <span class="sr-only">, change name</span>
          </a>
        }
      </div>
    </header>
  `,
})
export class UiAppHeader {
  readonly username = input('');
}
