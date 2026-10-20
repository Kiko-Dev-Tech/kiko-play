import { Component, input, linkedSignal, output } from '@angular/core';
import { FormField, form, maxLength, submit } from '@angular/forms/signals';
import { UiFieldErrors } from '../../../shared/ui/ui-field-errors';

/** The player's text field for a guess question. The guess can be changed until guessing closes. */
@Component({
  selector: 'ui-guess-form',
  imports: [FormField, UiFieldErrors],
  template: `
    <section class="card flex flex-col gap-3 p-4" aria-labelledby="guess-heading">
      <h2 id="guess-heading" class="text-lg font-bold text-gold-300">Your guess</h2>

      @if (open()) {
        <form (submit)="onSubmit($event)" class="flex flex-col gap-2" novalidate>
          <label for="guess-input" class="sr-only">Type your guess</label>
          <input
            id="guess-input"
            class="input text-lg"
            autocomplete="off"
            placeholder="Type your guess…"
            [formField]="guessForm.text"
            [attr.aria-describedby]="guessForm.text().invalid() ? 'guess-errors' : null"
          />
          <ui-field-errors [field]="guessForm.text" errorId="guess-errors" />
          <button type="submit" class="btn btn-primary">
            {{ submittedGuess() ? 'Change guess' : 'Submit guess' }}
          </button>
        </form>
      } @else {
        <p class="text-slate-300">
          {{ revealed() ? 'Guessing is over.' : 'Guessing opens together with the question.' }}
        </p>
      }

      <p class="text-sm text-slate-300" aria-live="polite">
        @if (submittedGuess(); as guess) {
          Submitted: <strong class="text-white">{{ guess }}</strong> ·
        }
        {{ guessedCount() }} of {{ playerCount() }} players guessed
      </p>
    </section>
  `,
})
export class UiGuessForm {
  readonly open = input(false);
  readonly revealed = input(false);
  readonly submittedGuess = input('');
  readonly guessedCount = input(0);
  readonly playerCount = input(0);
  readonly guessed = output<string>();

  private readonly model = linkedSignal(() => ({ text: this.submittedGuess() }));
  protected readonly guessForm = form(this.model, (path) => {
    maxLength(path.text, 200, { message: 'Use at most 200 characters.' });
  });

  protected onSubmit(event: Event): void {
    event.preventDefault();
    void submit(this.guessForm, async () => {
      this.guessed.emit(this.model().text.trim());
      return undefined;
    });
  }
}
