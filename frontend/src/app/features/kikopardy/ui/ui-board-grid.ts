import { Component, computed, input, output } from '@angular/core';
import type { BoardCellView, GameView } from '../kikopardy.contract';

/** The Jeopardy board. Only the host can pick questions or reset played ones. */
@Component({
  selector: 'ui-board-grid',
  template: `
    <div class="overflow-x-auto">
      <!-- Every column keeps a readable width; on small screens the board scrolls sideways. -->
      <table
        class="w-full table-fixed border-separate border-spacing-2"
        [style.min-width.rem]="categories().length * 7"
      >
        <caption class="sr-only">
          Game board
        </caption>
        <thead>
          <tr>
            @for (category of categories(); track category.id) {
              <th
                scope="col"
                class="rounded-lg bg-stage-700 px-1.5 py-3 align-middle text-xs leading-tight font-extrabold text-white uppercase sm:tracking-wide hyphens-auto [overflow-wrap:anywhere] xl:text-sm"
                [attr.title]="category.name"
              >
                {{ category.name }}
              </th>
            }
          </tr>
        </thead>
        <tbody>
          @for (row of rows(); track $index) {
            <tr>
              @for (cell of row; track $index) {
                <td class="h-16 sm:h-20">
                  @if (cell) {
                    <div class="relative h-full">
                      @if (interactive()) {
                        <button
                          type="button"
                          class="h-full w-full rounded-lg font-display text-xl transition sm:text-3xl"
                          [class]="cellClass(cell)"
                          [attr.aria-label]="
                            cell.value +
                            ' points' +
                            (cell.double ? ', Secret Double' : '') +
                            (cell.played ? ', played' : '')
                          "
                          (click)="selected.emit(cell.id)"
                        >
                          {{ cell.played ? '' : cell.value }}
                        </button>
                        @if (cell.double) {
                          <span
                            class="pointer-events-none absolute top-1 left-1 rounded bg-gold-400 px-1.5 text-xs font-bold text-stage-950"
                            title="Secret Double (only you see this)"
                            aria-hidden="true"
                            >2×</span
                          >
                        }
                        @if (cell.played) {
                          <button
                            type="button"
                            class="absolute top-1 right-1 rounded px-1.5 text-xs text-slate-300 hover:bg-stage-700 hover:text-white"
                            [attr.aria-label]="'Mark ' + cell.value + ' as not played'"
                            title="Mark as not played"
                            (click)="unplayed.emit(cell.id)"
                          >
                            ↺
                          </button>
                        }
                      } @else {
                        <div
                          class="flex h-full items-center justify-center rounded-lg font-display text-xl sm:text-3xl"
                          [class]="cellClass(cell)"
                        >
                          @if (cell.played) {
                            <span class="sr-only">Played</span>
                          } @else {
                            {{ cell.value }}
                          }
                        </div>
                      }
                    </div>
                  }
                </td>
              }
            </tr>
          }
        </tbody>
      </table>
    </div>
  `,
})
export class UiBoardGrid {
  readonly categories = input.required<GameView['categories']>();
  readonly interactive = input(false);
  readonly selected = output<string>();
  readonly unplayed = output<string>();

  /** The board as rows, padded where categories have fewer questions. */
  protected readonly rows = computed(() => {
    const categories = this.categories();
    const height = Math.max(0, ...categories.map((c) => c.cells.length));
    return Array.from({ length: height }, (_, row) =>
      categories.map((c): BoardCellView | null => c.cells[row] ?? null),
    );
  });

  protected cellClass(cell: BoardCellView): string {
    if (cell.played) {
      return 'bg-stage-900 text-stage-700 border border-stage-800';
    }
    return this.interactive()
      ? 'bg-stage-800 text-gold-400 shadow-md hover:bg-stage-600 hover:text-gold-300 cursor-pointer'
      : 'bg-stage-800 text-gold-400 shadow-md';
  }
}
