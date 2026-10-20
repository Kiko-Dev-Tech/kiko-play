import { Component, input, linkedSignal, output } from '@angular/core';

/** Lets the host change a score with +/- buttons or by typing a new value. */
@Component({
  selector: 'ui-score-editor',
  template: `
    <div class="flex items-center gap-1">
      <button
        type="button"
        class="btn btn-ghost btn-sm"
        [attr.aria-label]="'Subtract ' + step() + ' from ' + playerName()"
        (click)="changed.emit(score() - step())"
      >
        −
      </button>
      <input
        type="number"
        class="input w-24 px-2 py-1 text-right font-mono"
        [attr.aria-label]="'Score of ' + playerName()"
        [value]="draft()"
        (input)="draft.set($any($event.target).valueAsNumber)"
        (keydown.enter)="commit()"
        (blur)="commit()"
      />
      <button
        type="button"
        class="btn btn-ghost btn-sm"
        [attr.aria-label]="'Add ' + step() + ' to ' + playerName()"
        (click)="changed.emit(score() + step())"
      >
        +
      </button>
    </div>
  `,
})
export class UiScoreEditor {
  readonly score = input.required<number>();
  readonly playerName = input.required<string>();
  readonly step = input(100);
  readonly changed = output<number>();

  protected readonly draft = linkedSignal(() => this.score());

  protected commit(): void {
    const value = this.draft();
    if (Number.isFinite(value) && value !== this.score()) {
      this.changed.emit(value);
    } else {
      this.draft.set(this.score());
    }
  }
}
