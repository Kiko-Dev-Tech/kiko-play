import { Component, computed, input, output, signal } from '@angular/core';
import type { Media } from '../kikopardy.contract';
import { formatTime, parseTime, youtubeVideoId } from '../services/youtube';
import { UiMediaEmbed } from './ui-media-embed';

type MediaType = Media['type'] | 'none';

/** Edits an optional YouTube clip (with start/end time) or image. */
@Component({
  selector: 'ui-media-editor',
  imports: [UiMediaEmbed],
  template: `
    <fieldset class="rounded-lg border border-stage-700 p-3">
      <legend class="px-1 text-sm font-medium text-slate-300">{{ label() }}</legend>
      <div class="flex flex-wrap gap-2">
        <select
          class="input w-auto"
          [attr.aria-label]="label() + ' type'"
          [value]="type()"
          (change)="changeType($any($event.target).value)"
        >
          <option value="none">No media</option>
          <option value="youtube">YouTube</option>
          <option value="image">Image</option>
        </select>
        @if (media(); as m) {
          <input
            class="input min-w-48 flex-1"
            type="url"
            [attr.aria-label]="label() + ' URL'"
            [placeholder]="m.type === 'youtube' ? 'https://youtu.be/…' : 'https://…/image.png'"
            [value]="m.url"
            (change)="patch({ url: $any($event.target).value.trim() })"
          />
        }
      </div>

      @if (media(); as m) {
        @if (m.type === 'youtube') {
          <div class="mt-2 flex flex-wrap items-end gap-2">
            <label class="text-sm text-slate-300">
              Start
              <input
                class="input mt-1 w-24"
                placeholder="0:00"
                [value]="formatTime(m.start)"
                (change)="setTime('start', $any($event.target).value)"
              />
            </label>
            <label class="text-sm text-slate-300">
              End
              <input
                class="input mt-1 w-24"
                placeholder="end"
                [value]="formatTime(m.end)"
                (change)="setTime('end', $any($event.target).value)"
              />
            </label>
            <span class="pb-2 text-xs text-slate-400">Seconds or m:ss, both optional</span>
          </div>
        }
        @if (problem(); as text) {
          <p class="mt-2 text-sm text-rose-300" role="alert">{{ text }}</p>
        }
        @if (m.url && !problem()) {
          <button type="button" class="btn btn-ghost btn-sm mt-2" (click)="preview.set(!preview())">
            {{ preview() ? 'Hide preview' : 'Show preview' }}
          </button>
          @if (preview()) {
            <ui-media-embed
              class="mt-2 block max-w-md"
              [media]="m"
              [label]="label() + ' preview'"
            />
          }
        }
      }
    </fieldset>
  `,
})
export class UiMediaEditor {
  readonly media = input<Media | null | undefined>(null);
  readonly label = input('Media');
  readonly changed = output<Media | null>();

  protected readonly preview = signal(false);
  protected readonly timeError = signal<string | null>(null);
  protected readonly formatTime = formatTime;

  protected readonly type = computed<MediaType>(() => this.media()?.type ?? 'none');

  protected readonly problem = computed(() => {
    const media = this.media();
    if (this.timeError()) {
      return this.timeError();
    }
    if (!media?.url) {
      return media ? 'Add a link.' : null;
    }
    if (!/^https?:\/\//.test(media.url)) {
      return 'The link must start with http:// or https://.';
    }
    if (media.type === 'youtube') {
      if (!youtubeVideoId(media.url)) {
        return 'This is not a valid YouTube link.';
      }
      if (media.start !== undefined && media.end !== undefined && media.end <= media.start) {
        return 'The end must be after the start.';
      }
    }
    return null;
  });

  protected changeType(type: MediaType): void {
    this.timeError.set(null);
    const url = this.media()?.url ?? '';
    this.changed.emit(type === 'none' ? null : { type, url });
  }

  protected patch(patch: Partial<{ url: string; start?: number; end?: number }>): void {
    const media = this.media();
    if (media) {
      this.changed.emit({ ...media, ...patch } as Media);
    }
  }

  protected setTime(key: 'start' | 'end', text: string): void {
    const seconds = parseTime(text);
    if (seconds === null) {
      this.timeError.set('Use seconds (90) or minutes:seconds (1:30).');
      return;
    }
    this.timeError.set(null);
    const media = this.media();
    if (media?.type === 'youtube') {
      const { [key]: _removed, ...rest } = media;
      this.changed.emit(seconds === undefined ? rest : { ...rest, [key]: seconds });
    }
  }
}
