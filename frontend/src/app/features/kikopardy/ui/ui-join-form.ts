import { Component, output, signal } from '@angular/core';
import { FormField, form, pattern, required, submit } from '@angular/forms/signals';
import { UiFieldErrors } from '../../../shared/ui/ui-field-errors';

@Component({
  selector: 'ui-join-form',
  imports: [FormField, UiFieldErrors],
  template: `
    <form (submit)="onSubmit($event)" class="flex flex-col gap-3" novalidate>
      <div>
        <label for="join-code" class="label">Join code</label>
        <input
          id="join-code"
          class="input font-mono text-2xl tracking-[0.3em] uppercase"
          autocomplete="off"
          placeholder="ABCDE"
          [formField]="joinForm.code"
          [attr.aria-describedby]="joinForm.code().invalid() ? 'join-code-errors' : null"
        />
        <ui-field-errors [field]="joinForm.code" errorId="join-code-errors" />
      </div>
      <button type="submit" class="btn btn-primary">Join game</button>
    </form>
  `,
})
export class UiJoinForm {
  readonly joined = output<string>();

  private readonly model = signal({ code: '' });
  protected readonly joinForm = form(this.model, (path) => {
    required(path.code, { message: 'Enter the code your host shared.' });
    pattern(path.code, /^\s*[a-zA-Z0-9]{4,8}\s*$/, {
      message: 'Codes have 4 to 8 letters or digits.',
    });
  });

  protected onSubmit(event: Event): void {
    event.preventDefault();
    void submit(this.joinForm, async () => {
      this.joined.emit(this.model().code.trim().toUpperCase());
      return undefined;
    });
  }
}
