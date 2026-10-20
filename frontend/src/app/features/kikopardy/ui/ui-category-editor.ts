import { Component, input, output } from '@angular/core';
import type { Category, Question } from '../kikopardy.contract';
import { UiQuestionEditor } from './ui-question-editor';

export interface QuestionMove {
  questionId: string;
  offset: -1 | 1;
}

@Component({
  selector: 'ui-category-editor',
  imports: [UiQuestionEditor],
  template: `
    <section class="card flex flex-col gap-3 p-4" [attr.aria-label]="'Category ' + category().name">
      <div class="flex flex-wrap items-center gap-2">
        <input
          class="input min-w-48 flex-1 font-display text-lg tracking-wide uppercase"
          aria-label="Category name"
          [value]="category().name"
          (change)="renamed.emit($any($event.target).value)"
        />
        <button
          type="button"
          class="btn btn-ghost btn-sm"
          [disabled]="first()"
          (click)="moved.emit(-1)"
          aria-label="Move category left"
        >
          ←
        </button>
        <button
          type="button"
          class="btn btn-ghost btn-sm"
          [disabled]="last()"
          (click)="moved.emit(1)"
          aria-label="Move category right"
        >
          →
        </button>
        <button type="button" class="btn btn-ghost btn-sm text-rose-300" (click)="removed.emit()">
          Delete category
        </button>
      </div>

      <ol class="flex flex-col gap-2">
        @for (
          question of category().questions;
          track question.id;
          let isFirst = $first, isLast = $last
        ) {
          <li>
            <ui-question-editor
              [question]="question"
              [first]="isFirst"
              [last]="isLast"
              (changed)="questionChanged.emit($event)"
              (moved)="questionMoved.emit({ questionId: question.id, offset: $event })"
              (removed)="questionRemoved.emit(question.id)"
            />
          </li>
        }
      </ol>
      <button
        type="button"
        class="btn btn-secondary btn-sm self-start"
        (click)="questionAdded.emit()"
      >
        + Add question
      </button>
    </section>
  `,
})
export class UiCategoryEditor {
  readonly category = input.required<Category>();
  readonly first = input(false);
  readonly last = input(false);
  readonly renamed = output<string>();
  readonly moved = output<-1 | 1>();
  readonly removed = output();
  readonly questionAdded = output();
  readonly questionChanged = output<Question>();
  readonly questionMoved = output<QuestionMove>();
  readonly questionRemoved = output<string>();
}
