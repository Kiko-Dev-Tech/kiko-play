import { Component, effect, inject, input, untracked } from '@angular/core';
import { Router } from '@angular/router';
import { UiErrorMessage } from '../../../shared/ui/ui-error-message';
import { UiPageHeader } from '../../../shared/ui/ui-page-header';
import type { Category } from '../kikopardy.contract';
import { BoardEditorService } from '../services/board-editor.service';
import { UiCategoryEditor } from '../ui/ui-category-editor';

@Component({
  selector: 'page-board-editor',
  imports: [UiPageHeader, UiErrorMessage, UiCategoryEditor],
  providers: [BoardEditorService],
  host: {
    '(window:beforeunload)': 'warnBeforeLeaving($event)',
  },
  template: `
    <ui-page-header
      [title]="editor.boardId() ? 'Edit board' : 'New board'"
      [subtitle]="
        editor.board().categories.length +
        (editor.board().categories.length === 1 ? ' category · ' : ' categories · ') +
        editor.questionCount() +
        (editor.questionCount() === 1 ? ' question' : ' questions')
      "
      backLink="/kikopardy"
      backLabel="Lobby"
    >
      <span class="self-center text-sm text-slate-300" role="status">
        {{ editor.saving() ? 'Saving…' : editor.dirty() ? 'Unsaved changes' : 'All changes saved' }}
      </span>
      <button
        type="button"
        class="btn btn-primary"
        [disabled]="editor.saving() || !editor.dirty()"
        (click)="save()"
      >
        Save board
      </button>
    </ui-page-header>

    <ui-error-message [message]="editor.error()" class="mb-4 block" />

    @if (editor.loading()) {
      <p role="status" class="text-slate-300">Loading board…</p>
    } @else {
      <div class="mb-6 max-w-xl">
        <label for="board-name" class="label">Board name</label>
        <input
          id="board-name"
          class="input text-lg"
          [value]="editor.board().name"
          (change)="editor.rename($any($event.target).value)"
        />
      </div>

      <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        @for (
          category of editor.board().categories;
          track category.id;
          let isFirst = $first, isLast = $last
        ) {
          <ui-category-editor
            [category]="category"
            [first]="isFirst"
            [last]="isLast"
            (renamed)="editor.updateCategory(category.id, { name: $event })"
            (moved)="editor.moveCategory(category.id, $event)"
            (removed)="removeCategory(category)"
            (questionAdded)="editor.addQuestion(category.id)"
            (questionChanged)="editor.updateQuestion(category.id, $event)"
            (questionMoved)="editor.moveQuestion(category.id, $event.questionId, $event.offset)"
            (questionRemoved)="editor.removeQuestion(category.id, $event)"
          />
        }
        <button
          type="button"
          class="min-h-40 rounded-2xl border-2 border-dashed border-stage-600 text-lg font-semibold text-slate-300 hover:border-gold-400 hover:text-gold-300"
          (click)="editor.addCategory()"
        >
          + Add category
        </button>
      </div>
    }
  `,
})
export class PageBoardEditor {
  /** Route param: a board ID, or undefined for a new board. */
  readonly id = input<string>();

  protected readonly editor = inject(BoardEditorService);
  private readonly router = inject(Router);

  constructor() {
    let initialized = false;
    effect(() => {
      const id = this.id() ?? null;
      untracked(() => {
        // After saving a new board the URL gets its ID. That board is already loaded.
        if (!initialized || id !== this.editor.boardId()) {
          initialized = true;
          void this.editor.load(id);
        }
      });
    });
  }

  protected async save(): Promise<void> {
    const wasNew = !this.editor.boardId();
    const id = await this.editor.save();
    if (id && wasNew) {
      // Keep editing the now saved board under its real URL.
      void this.router.navigate(['/kikopardy/boards', id], { replaceUrl: true });
    }
  }

  protected removeCategory(category: Category): void {
    if (confirm(`Delete the category "${category.name}" with all its questions?`)) {
      this.editor.removeCategory(category.id);
    }
  }

  protected warnBeforeLeaving(event: BeforeUnloadEvent): void {
    if (this.editor.dirty()) {
      event.preventDefault();
    }
  }
}
