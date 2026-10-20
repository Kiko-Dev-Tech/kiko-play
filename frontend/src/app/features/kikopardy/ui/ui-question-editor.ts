import { Component, input, output, signal } from '@angular/core';
import type { Media, Question } from '../kikopardy.contract';
import { UiMediaEditor } from './ui-media-editor';

/** One question row: collapsed it shows a summary, expanded all fields. */
@Component({
  selector: 'ui-question-editor',
  imports: [UiMediaEditor],
  template: `
    <div class="rounded-xl border border-stage-700 bg-stage-950/50">
      <div class="flex items-center gap-2 p-2">
        <button
          type="button"
          class="flex min-w-0 flex-1 items-center gap-3 rounded-lg px-2 py-1 text-left hover:bg-stage-800"
          [attr.aria-expanded]="expanded()"
          (click)="expanded.set(!expanded())"
        >
          <span class="font-display text-lg text-gold-400">{{ question().value }}</span>
          <span
            class="truncate"
            [class]="question().question ? 'text-white' : 'text-slate-400 italic'"
          >
            {{ question().question || 'Empty question' }}
          </span>
          @if (question().type === 'guess') {
            <span
              class="rounded bg-stage-700 px-1.5 text-xs font-semibold text-gold-300 uppercase"
              title="Guess question"
              >Guess</span
            >
          }
          @if (question().questionMedia || question().answerMedia) {
            <span class="text-xs text-slate-300" title="Has media">🎬</span>
          }
        </button>
        <button
          type="button"
          class="btn btn-ghost btn-sm"
          [disabled]="first()"
          (click)="moved.emit(-1)"
          [attr.aria-label]="'Move ' + question().value + ' up'"
        >
          ↑
        </button>
        <button
          type="button"
          class="btn btn-ghost btn-sm"
          [disabled]="last()"
          (click)="moved.emit(1)"
          [attr.aria-label]="'Move ' + question().value + ' down'"
        >
          ↓
        </button>
        <button
          type="button"
          class="btn btn-ghost btn-sm text-rose-300"
          (click)="removed.emit()"
          [attr.aria-label]="'Delete question ' + question().value"
        >
          ✕
        </button>
      </div>

      @if (expanded()) {
        <div class="grid gap-3 border-t border-stage-700 p-3">
          <label class="label">
            Type
            <select
              class="input mt-1"
              aria-label="Question type"
              [value]="question().type ?? 'buzzer'"
              (change)="patch({ type: $any($event.target).value })"
            >
              <option value="buzzer">Buzzer: first to buzz answers out loud</option>
              <option value="guess">Guess: everyone types a guess, you pick the best</option>
            </select>
          </label>
          <label class="label">
            Points
            <input
              type="number"
              step="100"
              class="input mt-1 w-32"
              [value]="question().value"
              (change)="patch({ value: toInt($any($event.target).value) })"
            />
          </label>
          <label class="label">
            Question
            <textarea
              rows="2"
              class="input mt-1"
              [value]="question().question"
              (change)="patch({ question: $any($event.target).value })"
            ></textarea>
          </label>
          <ui-media-editor
            label="Question media"
            [media]="question().questionMedia"
            (changed)="patchMedia('questionMedia', $event)"
          />
          <label class="label">
            Answer
            <textarea
              rows="2"
              class="input mt-1"
              [value]="question().answer"
              (change)="patch({ answer: $any($event.target).value })"
            ></textarea>
          </label>
          <ui-media-editor
            label="Answer media"
            [media]="question().answerMedia"
            (changed)="patchMedia('answerMedia', $event)"
          />
        </div>
      }
    </div>
  `,
})
export class UiQuestionEditor {
  readonly question = input.required<Question>();
  readonly first = input(false);
  readonly last = input(false);
  readonly changed = output<Question>();
  readonly moved = output<-1 | 1>();
  readonly removed = output();

  protected readonly expanded = signal(false);

  protected patch(patch: Partial<Question>): void {
    this.changed.emit({ ...this.question(), ...patch });
  }

  protected patchMedia(key: 'questionMedia' | 'answerMedia', media: Media | null): void {
    this.patch({ [key]: media });
  }

  protected toInt(value: string): number {
    const parsed = Math.round(Number(value));
    return Number.isFinite(parsed) ? parsed : 0;
  }
}
