import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

/** Page title with an optional back link. Actions are projected to the right. */
@Component({
  selector: 'ui-page-header',
  imports: [RouterLink],
  template: `
    <header class="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        @if (backLink(); as link) {
          <a
            [routerLink]="link"
            class="mb-1 inline-block text-sm text-slate-300 hover:text-gold-300"
          >
            <span aria-hidden="true">←</span> {{ backLabel() }}
          </a>
        }
        <h1 class="font-display text-3xl tracking-wide text-gold-400 uppercase">{{ title() }}</h1>
        @if (subtitle()) {
          <p class="mt-1 text-slate-300">{{ subtitle() }}</p>
        }
      </div>
      <div class="flex flex-wrap gap-2">
        <ng-content />
      </div>
    </header>
  `,
})
export class UiPageHeader {
  readonly title = input.required<string>();
  readonly subtitle = input<string>();
  readonly backLink = input<string>();
  readonly backLabel = input('Back');
}
