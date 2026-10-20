import { Component, input, linkedSignal, output } from '@angular/core';
import { FormField, form, maxLength, required, submit } from '@angular/forms/signals';
import { UiFieldErrors } from '../../shared/ui/ui-field-errors';

@Component({
  selector: 'ui-username-form',
  imports: [FormField, UiFieldErrors],
  template: `
    <form (submit)="onSubmit($event)" class="flex flex-col gap-4" novalidate>
      <div>
        <label for="username" class="label">Username</label>
        <input
          id="username"
          class="input text-lg"
          autocomplete="nickname"
          placeholder="e.g. Kiko"
          [formField]="usernameForm.name"
          [attr.aria-describedby]="usernameForm.name().invalid() ? 'username-errors' : null"
        />
        <ui-field-errors [field]="usernameForm.name" errorId="username-errors" />
      </div>
      <button type="submit" class="btn btn-primary text-lg">Let's play</button>
    </form>
  `,
})
export class UiUsernameForm {
  readonly initialName = input('');
  readonly submitted = output<string>();

  private readonly model = linkedSignal(() => ({ name: this.initialName() }));
  protected readonly usernameForm = form(this.model, (path) => {
    required(path.name, { message: 'Please enter a username.' });
    maxLength(path.name, 30, { message: 'Use at most 30 characters.' });
  });

  protected onSubmit(event: Event): void {
    event.preventDefault();
    void submit(this.usernameForm, async () => {
      this.submitted.emit(this.model().name.trim());
      return undefined;
    });
  }
}
