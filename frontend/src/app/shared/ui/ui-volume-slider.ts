import { Component, input, output } from '@angular/core';

@Component({
  selector: 'ui-volume-slider',
  template: `
    <label class="flex items-center gap-3 text-sm text-slate-300">
      <span aria-hidden="true">{{ volume() === 0 ? '🔇' : volume() < 50 ? '🔉' : '🔊' }}</span>
      <span class="sr-only">Video volume</span>
      <input
        type="range"
        min="0"
        max="100"
        step="5"
        class="h-2 flex-1 cursor-pointer accent-gold-400"
        [value]="volume()"
        (input)="changed.emit($any($event.target).valueAsNumber)"
      />
      <span class="w-10 text-right font-mono" aria-hidden="true">{{ volume() }}%</span>
    </label>
  `,
})
export class UiVolumeSlider {
  readonly volume = input.required<number>();
  readonly changed = output<number>();
}
