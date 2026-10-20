import {
  Component,
  ElementRef,
  effect,
  inject,
  input,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { VolumeService } from '../../core/volume.service';
import { YoutubeApiService } from '../../core/youtube-api.service';
import { UiVolumeSlider } from './ui-volume-slider';

export interface PlayerClip {
  videoId: string;
  start?: number;
  end?: number;
}

/**
 * A YouTube player with a volume slider. The volume is set before playback starts,
 * so autoplay never starts at full volume. The player is only recreated when the clip changes.
 */
@Component({
  selector: 'ui-youtube-player',
  imports: [UiVolumeSlider],
  template: `
    <div class="aspect-video w-full overflow-hidden rounded-xl bg-black">
      <div #host class="h-full w-full" [attr.aria-label]="label()"></div>
    </div>
    @if (error(); as message) {
      <p class="mt-2 text-sm text-rose-300" role="alert">{{ message }}</p>
    }
    <ui-volume-slider
      class="mt-2 block"
      [volume]="volumes.volume()"
      (changed)="volumes.setVolume($event)"
    />
  `,
})
export class UiYoutubePlayer {
  readonly clip = input.required<PlayerClip>();
  readonly autoplay = input(false);
  readonly label = input('Video');

  protected readonly volumes = inject(VolumeService);
  protected readonly error = signal<string | null>(null);
  private readonly api = inject(YoutubeApiService);
  private readonly host = viewChild.required<ElementRef<HTMLElement>>('host');
  private player: YT.Player | null = null;

  constructor() {
    effect((onCleanup) => {
      const clip = this.clip();
      const autoplay = this.autoplay();
      const host = this.host().nativeElement;
      let created: YT.Player | null = null;
      let cancelled = false;

      untracked(() => {
        this.error.set(null);
        this.api.load().then(
          (yt) => {
            if (cancelled) {
              return;
            }
            // YouTube replaces the target element with its iframe.
            const target = document.createElement('div');
            host.replaceChildren(target);
            created = new yt.Player(target, {
              host: 'https://www.youtube-nocookie.com',
              videoId: clip.videoId,
              width: '100%',
              height: '100%',
              playerVars: {
                rel: 0,
                playsinline: 1,
                start: clip.start,
                end: clip.end,
              },
              events: {
                onReady: (event) => {
                  if (cancelled) {
                    return;
                  }
                  this.player = event.target;
                  event.target.setVolume(this.volumes.volume());
                  if (autoplay) {
                    event.target.playVideo();
                  }
                },
              },
            });
          },
          (error: Error) => this.error.set(error.message),
        );
      });

      onCleanup(() => {
        cancelled = true;
        created?.destroy();
        this.player = null;
      });
    });

    // Volume changes apply to the running video right away.
    effect(() => {
      const volume = this.volumes.volume();
      untracked(() => this.player?.setVolume(volume));
    });
  }
}
