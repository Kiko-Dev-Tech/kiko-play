import { Component, input } from '@angular/core';
import type { CurrentQuestionView } from '../kikopardy.contract';
import { UiMediaEmbed } from './ui-media-embed';

/**
 * The selected question with its media, and the answer once it is visible.
 * Players get no question text until the buzzers open, so they see a placeholder meanwhile.
 */
@Component({
  selector: 'ui-question-view',
  imports: [UiMediaEmbed],
  template: `
    <article
      class="flex flex-col gap-5 rounded-2xl border-2 border-stage-600 bg-gradient-to-b from-stage-700 to-stage-900 p-6 text-center shadow-xl sm:p-10"
      aria-live="polite"
    >
      @if (current().question.double) {
        <div
          class="mx-auto flex flex-col items-center gap-1 rounded-2xl border-2 border-gold-300 bg-gold-400 px-6 py-3 text-stage-950 shadow-lg shadow-gold-400/30"
          role="status"
        >
          <span class="font-display text-2xl tracking-wider uppercase sm:text-3xl"
            >Secret Double!</span
          >
          <span class="text-sm font-semibold">
            {{ current().question.value }} × 2 = {{ current().question.points }} points
          </span>
        </div>
      }
      <p
        class="text-sm font-semibold tracking-widest text-gold-300 uppercase [overflow-wrap:anywhere]"
      >
        {{ current().question.categoryName }} · {{ current().question.points }}
      </p>
      @if (current().question.question === undefined) {
        <div class="flex flex-col items-center gap-3 py-8">
          <span class="text-5xl" aria-hidden="true">🎙️</span>
          <h2 class="font-display text-2xl leading-snug text-white sm:text-3xl">
            Listen to the host…
          </h2>
          <p class="text-slate-300">The question shows up when the buzzers open.</p>
        </div>
      } @else {
        @if (!current().questionRevealed) {
          <p
            class="self-center rounded-full border border-dashed border-slate-500 px-3 py-1 text-xs font-semibold tracking-widest text-slate-300 uppercase"
          >
            Only you can see this. Read it out, then open the buzzers.
          </p>
        }
        <h2 class="font-display text-2xl leading-snug text-white sm:text-4xl">
          {{ current().question.question }}
        </h2>
        <ui-media-embed
          [media]="current().question.questionMedia"
          [autoplay]="autoplay()"
          label="Question media"
        />
      }

      @if (current().question.answer !== undefined) {
        <div
          class="mt-2 rounded-xl border p-4"
          [class]="
            current().answerRevealed
              ? 'border-gold-400 bg-stage-950/60'
              : 'border-dashed border-slate-500 bg-stage-950/40'
          "
        >
          <p
            class="text-xs font-semibold tracking-widest uppercase"
            [class]="current().answerRevealed ? 'text-gold-300' : 'text-slate-300'"
          >
            {{ current().answerRevealed ? 'Answer' : 'Answer (only you can see this)' }}
          </p>
          <p class="mt-1 text-xl font-bold text-white sm:text-2xl">
            {{ current().question.answer }}
          </p>
          @if (current().answerRevealed || showHiddenAnswerMedia()) {
            <ui-media-embed
              class="mt-3 block"
              [media]="current().question.answerMedia"
              [autoplay]="autoplay() && current().answerRevealed"
              label="Answer media"
            />
          }
        </div>
      }
    </article>
  `,
})
export class UiQuestionView {
  readonly current = input.required<CurrentQuestionView>();
  readonly autoplay = input(true);
  /** Whether the host also gets a preview of the answer media before it is revealed. */
  readonly showHiddenAnswerMedia = input(false);
}
