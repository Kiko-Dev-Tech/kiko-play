import { Component, computed, input } from '@angular/core';
import type { GameDetail } from '../kikopardy.contract';

interface PlayedRow {
  id: string;
  categoryName: string;
  value: number;
  question: string;
  answer: string;
  results: { name: string; correct: boolean; delta: number }[];
}

/** The questions of a finished game in board order, with who answered right or wrong. */
@Component({
  selector: 'ui-played-question-list',
  template: `
    @if (rows().length === 0) {
      <p class="text-slate-300">No questions were played.</p>
    } @else {
      <ol class="flex flex-col gap-3">
        @for (row of rows(); track row.id) {
          <li class="rounded-xl border border-stage-700 bg-stage-950/50 p-4">
            <p class="text-sm font-semibold tracking-wide text-gold-300 uppercase">
              {{ row.categoryName }} · {{ row.value }}
            </p>
            <p class="mt-1 text-white">{{ row.question }}</p>
            <p class="mt-1 text-slate-300">
              Answer: <strong class="text-white">{{ row.answer }}</strong>
            </p>
            @if (row.results.length) {
              <ul class="mt-2 flex flex-wrap gap-2">
                @for (result of row.results; track $index) {
                  <li
                    class="rounded-full px-3 py-0.5 text-sm"
                    [class]="
                      result.correct
                        ? 'bg-emerald-500/20 text-emerald-200'
                        : 'bg-rose-500/20 text-rose-200'
                    "
                  >
                    {{ result.correct ? '✓' : '✕' }} {{ result.name }} ({{
                      result.delta > 0 ? '+' : ''
                    }}{{ result.delta }})
                  </li>
                }
              </ul>
            } @else {
              <p class="mt-2 text-sm text-slate-400">Nobody scored.</p>
            }
          </li>
        }
      </ol>
    }
  `,
})
export class UiPlayedQuestionList {
  readonly game = input.required<GameDetail>();

  protected readonly rows = computed<PlayedRow[]>(() => {
    const game = this.game();
    const names = new Map(game.players.map((p) => [p.id, p.name]));
    const played = new Map(game.playedQuestions.map((p) => [p.questionId, p]));
    return game.board.categories.flatMap((category) =>
      category.questions
        .filter((q) => played.has(q.id))
        .map((q) => ({
          id: q.id,
          categoryName: category.name,
          value: q.value,
          question: q.question,
          answer: q.answer,
          results: (played.get(q.id)?.results ?? []).map((r) => ({
            name: names.get(r.playerId) ?? 'Unknown player',
            correct: r.correct,
            delta: r.delta,
          })),
        })),
    );
  });
}
