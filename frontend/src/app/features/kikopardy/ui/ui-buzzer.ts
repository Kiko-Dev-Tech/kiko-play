import { Component, computed, input, output } from '@angular/core';
import type { BuzzerState } from '../services/kikopardy-game.service';

const LABELS: Record<BuzzerState, string> = {
  waiting: 'Wait for the host…',
  open: 'BUZZ!',
  tried: 'You already answered',
  me: 'You buzzed! Answer now',
  other: '',
};

/** The big buzzer button. Space bar buzzes too. */
@Component({
  selector: 'ui-buzzer',
  host: {
    '(document:keydown.space)': 'onSpace($event)',
  },
  template: `
    <div class="flex flex-col items-center gap-3">
      <button
        type="button"
        class="aspect-square w-56 max-w-full rounded-full border-8 font-display text-3xl tracking-wider uppercase shadow-2xl transition active:scale-95 sm:w-64"
        [class]="buttonClass()"
        [disabled]="state() !== 'open'"
        (click)="buzzed.emit()"
      >
        {{ label() }}
      </button>
      <p class="text-sm text-slate-300" aria-live="polite">
        @if (state() === 'open') {
          Press the button or the space bar
        }
      </p>
    </div>
  `,
})
export class UiBuzzer {
  readonly state = input.required<BuzzerState>();
  readonly buzzedName = input<string>();
  readonly buzzed = output();

  protected readonly label = computed(() =>
    this.state() === 'other' ? `${this.buzzedName()} buzzed` : LABELS[this.state()],
  );

  protected readonly buttonClass = computed(() => {
    switch (this.state()) {
      case 'open':
        return 'border-rose-200 bg-rose-500 text-white shadow-rose-500/60 ring-8 ring-rose-500/30 hover:bg-rose-400 cursor-pointer';
      case 'me':
        return 'border-gold-300 bg-gold-400 text-stage-950 text-2xl';
      case 'other':
        return 'border-stage-600 bg-stage-800 text-gold-300 text-2xl';
      default:
        return 'border-stage-700 bg-stage-900 text-slate-300 text-xl';
    }
  });

  protected onSpace(event: Event): void {
    const target = event.target as HTMLElement | null;
    // Don't steal the space bar from text fields or other buttons.
    if (target?.closest('input, textarea, select, button, [contenteditable]')) {
      return;
    }
    if (this.state() === 'open') {
      event.preventDefault();
      this.buzzed.emit();
    }
  }
}
