import { Component, input, output } from '@angular/core';

/** A reminder for players to set their video volume before the game starts. */
@Component({
  selector: 'ui-sound-check-hint',
  template: `
    <section class="card flex items-center justify-between gap-3 p-4">
      <p class="text-sm text-slate-300">
        <span aria-hidden="true">🔊</span>
        Videos play at <strong class="text-white">{{ volume() }}%</strong>. Check your volume before
        the game starts.
      </p>
      <button type="button" class="btn btn-secondary btn-sm shrink-0" (click)="soundCheck.emit()">
        Sound check
      </button>
    </section>
  `,
})
export class UiSoundCheckHint {
  readonly volume = input.required<number>();
  readonly soundCheck = output();
}
