import { Component, computed, inject, input } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import type { Media } from '../kikopardy.contract';
import { youtubeEmbedUrl } from '../services/youtube';

/** Shows a YouTube clip or an image. Invalid links show a short hint instead. */
@Component({
  selector: 'ui-media-embed',
  template: `
    @if (media(); as m) {
      @if (m.type === 'youtube') {
        @if (videoUrl(); as url) {
          <div class="aspect-video w-full overflow-hidden rounded-xl bg-black">
            <iframe
              class="h-full w-full"
              [src]="url"
              [title]="label()"
              allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
              referrerpolicy="strict-origin-when-cross-origin"
            ></iframe>
          </div>
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

  private readonly sanitizer = inject(DomSanitizer);

  protected readonly videoUrl = computed(() => {
    const media = this.media();
    if (media?.type !== 'youtube') {
      return null;
    }
    // Safe to trust: the URL is rebuilt from a validated video ID and numeric times only.
    const url = youtubeEmbedUrl(media.url, {
      start: media.start,
      end: media.end,
      autoplay: this.autoplay(),
    });
    return url ? this.sanitizer.bypassSecurityTrustResourceUrl(url) : null;
  });
}
