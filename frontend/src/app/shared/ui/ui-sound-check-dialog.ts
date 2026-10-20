import { Component, ElementRef, effect, input, output, viewChild } from '@angular/core';
import { UiVolumeSlider } from './ui-volume-slider';
import { UiYoutubePlayer, type PlayerClip } from './ui-youtube-player';

/** https://youtu.be/groaPrY41Rk?t=24 */
const EXAMPLE_CLIP: PlayerClip = { videoId: 'groaPrY41Rk', start: 24 };

/** Lets players set the volume for all game videos with an example video. */
@Component({
  selector: 'ui-sound-check-dialog',
  imports: [UiVolumeSlider, UiYoutubePlayer],
  template: `
    <dialog
      #dialog
      class="m-auto w-[min(40rem,calc(100vw-2rem))] rounded-2xl border border-stage-600 bg-stage-900 p-0 text-slate-100 shadow-2xl backdrop:bg-stage-950/80"
      aria-labelledby="sound-check-heading"
      (close)="closed.emit()"
    >
      @if (open()) {
        <div class="flex flex-col gap-4 p-5">
          <div class="flex items-start justify-between gap-4">
            <div>
              <h2 id="sound-check-heading" class="text-xl font-bold text-gold-300">Sound check</h2>
              <p class="mt-1 text-sm text-slate-300">
                Play the example and set a comfortable volume. All videos in the game use it.
              </p>
            </div>
            <button type="button" class="btn btn-ghost btn-sm" (click)="dialog.close()">
              <span aria-hidden="true">✕</span>
              <span class="sr-only">Close sound check</span>
            </button>
          </div>
          <ui-youtube-player [clip]="exampleClip" label="Example video" />
          <ui-volume-slider [volume]="volume()" (changed)="volumeChanged.emit($event)" />
          <button type="button" class="btn btn-primary self-end" (click)="dialog.close()">
            Done
          </button>
        </div>
      }
    </dialog>
  `,
})
export class UiSoundCheckDialog {
  readonly open = input(false);
  readonly volume = input.required<number>();
  readonly volumeChanged = output<number>();
  readonly closed = output();

  protected readonly exampleClip = EXAMPLE_CLIP;
  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');

  constructor() {
    effect(() => {
      const dialog = this.dialog().nativeElement;
      if (this.open() && !dialog.open) {
        dialog.showModal();
      } else if (!this.open() && dialog.open) {
        dialog.close();
      }
    });
  }
}
