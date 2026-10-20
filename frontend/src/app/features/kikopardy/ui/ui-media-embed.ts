import { Component, computed, input } from '@angular/core';
import { UiYoutubePlayer } from '../../../shared/ui/ui-youtube-player';
import type { Media } from '../kikopardy.contract';
import { youtubeClip, type YoutubeClip } from '../services/youtube';

/** Shows a YouTube clip or an image. Invalid links show a short hint instead. */
@Component({
  selector: 'ui-media-embed',
  imports: [UiYoutubePlayer],
  template: `
    @if (media(); as m) {
      @if (m.type === 'youtube') {
        @if (clip(); as c) {
          <ui-youtube-player [clip]="c" [autoplay]="autoplay()" [label]="label()" />
        } @else {
          <p class="text-sm text-rose-300">This is not a valid YouTube link.</p>
        }
      } @else {
        <img
          [src]="m.url"
          [alt]="label()"
          class="mx-auto max-h-[50vh] rounded-xl object-contain"
          referrerpolicy="no-referrer"
        />
      }
    }
  `,
})
export class UiMediaEmbed {
  readonly media = input<Media | null | undefined>(null);
  readonly autoplay = input(false);
  readonly label = input('Question media');

  /**
   * Every game update brings new media objects. Comparing by content keeps the same clip,
   * so the video keeps playing instead of restarting.
   */
  protected readonly clip = computed(
    () => {
      const media = this.media();
      return media?.type === 'youtube' ? youtubeClip(media.url, media.start, media.end) : null;
    },
    { equal: sameClip },
  );
}

function sameClip(a: YoutubeClip | null, b: YoutubeClip | null): boolean {
  return a?.videoId === b?.videoId && a?.start === b?.start && a?.end === b?.end;
}
