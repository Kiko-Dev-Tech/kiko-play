import { Service, computed, inject, signal } from '@angular/core';
import { httpErrorMessage } from '../../../core/http-error';
import type { BoardInput, Category, Question } from '../kikopardy.contract';
import { BoardApiService } from './board-api.service';
import { uuid } from '../../../core/uuid';

const DEFAULT_VALUES = [100, 200, 300, 400, 500];

/** The board being edited. All changes stay local until `save()`. */
@Service({ autoProvided: false })
export class BoardEditorService {
  private readonly api = inject(BoardApiService);

  private readonly _board = signal<BoardInput>({ name: 'New board', categories: [] });
  private readonly _boardId = signal<string | null>(null);
  private readonly _dirty = signal(false);
  private readonly _saving = signal(false);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);

  readonly board = this._board.asReadonly();
  readonly boardId = this._boardId.asReadonly();
  readonly dirty = this._dirty.asReadonly();
  readonly saving = this._saving.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly questionCount = computed(() =>
    this._board().categories.reduce((sum, c) => sum + c.questions.length, 0),
  );

  async load(id: string | null): Promise<void> {
    this._error.set(null);
    if (!id) {
      this._board.set({ name: 'New board', categories: [createCategory(1)] });
      this._boardId.set(null);
      this._dirty.set(true);
      return;
    }
    this._loading.set(true);
    try {
      const board = await this.api.get(id);
      this._board.set({ name: board.name, categories: board.categories });
      this._boardId.set(board.id);
      this._dirty.set(false);
    } catch (error) {
      this._error.set(httpErrorMessage(error, 'Could not load the board'));
    } finally {
      this._loading.set(false);
    }
  }

  /** Saves the board. Returns the board ID, which is new for a board saved the first time. */
  async save(): Promise<string | null> {
    this._saving.set(true);
    this._error.set(null);
    try {
      const id = this._boardId();
      const saved = id
        ? await this.api.update(id, this._board())
        : await this.api.create(this._board());
      this._boardId.set(saved.id);
      this._dirty.set(false);
      return saved.id;
    } catch (error) {
      this._error.set(httpErrorMessage(error, 'Could not save the board'));
      return null;
    } finally {
      this._saving.set(false);
    }
  }

  rename(name: string): void {
    this.change((board) => ({ ...board, name }));
  }

  addCategory(): void {
    this.change((board) => ({
      ...board,
      categories: [...board.categories, createCategory(board.categories.length + 1)],
    }));
  }

  updateCategory(categoryId: string, patch: Partial<Pick<Category, 'name'>>): void {
    this.changeCategory(categoryId, (category) => ({ ...category, ...patch }));
  }

  removeCategory(categoryId: string): void {
    this.change((board) => ({
      ...board,
      categories: board.categories.filter((c) => c.id !== categoryId),
    }));
  }

  moveCategory(categoryId: string, offset: -1 | 1): void {
    this.change((board) => ({ ...board, categories: move(board.categories, categoryId, offset) }));
  }

  addQuestion(categoryId: string): void {
    this.changeCategory(categoryId, (category) => {
      const last = category.questions.at(-1)?.value ?? 0;
      return { ...category, questions: [...category.questions, createQuestion(last + 100)] };
    });
  }

  updateQuestion(categoryId: string, question: Question): void {
    this.changeCategory(categoryId, (category) => ({
      ...category,
      questions: category.questions.map((q) => (q.id === question.id ? question : q)),
    }));
  }

  removeQuestion(categoryId: string, questionId: string): void {
    this.changeCategory(categoryId, (category) => ({
      ...category,
      questions: category.questions.filter((q) => q.id !== questionId),
    }));
  }

  moveQuestion(categoryId: string, questionId: string, offset: -1 | 1): void {
    this.changeCategory(categoryId, (category) => ({
      ...category,
      questions: move(category.questions, questionId, offset),
    }));
  }

  private changeCategory(categoryId: string, fn: (category: Category) => Category): void {
    this.change((board) => ({
      ...board,
      categories: board.categories.map((c) => (c.id === categoryId ? fn(c) : c)),
    }));
  }

  private change(fn: (board: BoardInput) => BoardInput): void {
    this._board.update(fn);
    this._dirty.set(true);
  }
}

function createCategory(index: number): Category {
  return {
    id: uuid(),
    name: `Category ${index}`,
    questions: DEFAULT_VALUES.map(createQuestion),
  };
}

function createQuestion(value: number): Question {
  return {
    id: uuid(),
    value,
    question: '',
    answer: '',
    questionMedia: null,
    answerMedia: null,
  };
}

function move<T extends { id: string }>(items: T[], id: string, offset: -1 | 1): T[] {
  const index = items.findIndex((item) => item.id === id);
  const target = index + offset;
  if (index < 0 || target < 0 || target >= items.length) {
    return items;
  }
  const result = [...items];
  [result[index], result[target]] = [result[target], result[index]];
  return result;
}
