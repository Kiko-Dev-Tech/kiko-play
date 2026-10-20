import { Component, input } from '@angular/core';
import type { CurrentQuestionView } from '../kikopardy.contract';
import { UiMediaEmbed } from './ui-media-embed';

/** The selected question with its media, and the answer once it is visible. */
@Component({
  selector: 'ui-question-view',
  imports: [UiMediaEmbed],
  template: `
    <article
      class="flex flex-col gap-5 rounded-2xl border-2 border-stage-600 bg-gradient-to-b from-stage-700 to-stage-900 p-6 text-center shadow-xl sm:p-10"
      aria-live="polite"
    >
      <p class="text-sm font-semibold tracking-widest text-gold-300 uppercase">
        {{ current().question.categoryName }} · {{ current().question.value }}
      </p>
      <h2 class="font-display text-2xl leading-snug text-white sm:text-4xl">
        {{ current().question.question }}
      </h2>
      <ui-media-embed
        [media]="current().question.questionMedia"
        [autoplay]="autoplay()"
        label="Question media"
      />

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
