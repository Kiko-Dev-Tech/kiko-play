import { DatePipe } from '@angular/common';
import { Component, input, output } from '@angular/core';
import type { BoardSummary } from '../kikopardy.contract';

@Component({
  selector: 'ui-board-list',
  imports: [DatePipe],
  template: `
    @if (boards().length === 0) {
      <p class="text-slate-300">No boards yet. Create your first one!</p>
    } @else {
      <ul class="flex flex-col gap-2">
        @for (board of boards(); track board.id) {
          <li
            class="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-stage-700 bg-stage-950/50 px-4 py-3"
          >
            <div>
              <p class="font-semibold text-white">{{ board.name }}</p>
              <p class="text-sm text-slate-300">
                {{ board.categoryCount }}
                {{ board.categoryCount === 1 ? 'category' : 'categories' }} ·
                {{ board.questionCount }}
                {{ board.questionCount === 1 ? 'question' : 'questions' }} · edited
                {{ board.updatedAt | date: 'short' }}
              </p>
            </div>
            <div class="flex flex-wrap gap-2">
              <button
                type="button"
                class="btn btn-primary btn-sm"
                [disabled]="board.questionCount === 0"
                (click)="start.emit(board.id)"
              >
                Start game
              </button>
              <button type="button" class="btn btn-secondary btn-sm" (click)="edit.emit(board.id)">
                Edit
              </button>
              <button type="button" class="btn btn-ghost btn-sm" (click)="duplicate.emit(board.id)">
                Duplicate
              </button>
              <button
                type="button"
                class="btn btn-ghost btn-sm text-rose-300"
                (click)="remove.emit(board)"
              >
                Delete
              </button>
            </div>
          </li>
        }
      </ul>
    }
  `,
})
export class UiBoardList {
  readonly boards = input.required<BoardSummary[]>();
  readonly start = output<string>();
  readonly edit = output<string>();
  readonly duplicate = output<string>();
  readonly remove = output<BoardSummary>();
}
