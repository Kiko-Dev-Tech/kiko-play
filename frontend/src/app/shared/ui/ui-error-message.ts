import { Component, booleanAttribute, input, output } from '@angular/core';

@Component({
  selector: 'ui-error-message',
  template: `
    @if (message(); as text) {
      <div
        role="alert"
        class="flex items-start justify-between gap-3 rounded-lg border border-rose-400/50 bg-rose-950/60 px-4 py-2 text-rose-100"
      >
        <span>{{ text }}</span>
        @if (dismissible()) {
          <button type="button" class="btn btn-ghost btn-sm" (click)="dismissed.emit()">
            <span aria-hidden="true">✕</span>
            <span class="sr-only">Dismiss error</span>
          </button>
        }
      </div>
    }
  `,
})
export class UiErrorMessage {
  readonly message = input<string | null>(null);
  readonly dismissible = input(false, { transform: booleanAttribute });
  readonly dismissed = output();
}
