import { Component, input, output, signal } from '@angular/core';
import { FormField, form, required, submit } from '@angular/forms/signals';
import { UiErrorMessage } from '../../../shared/ui/ui-error-message';
import { UiFieldErrors } from '../../../shared/ui/ui-field-errors';

@Component({
  selector: 'ui-admin-login-form',
  imports: [FormField, UiFieldErrors, UiErrorMessage],
  template: `
    <form (submit)="onSubmit($event)" class="flex flex-col gap-3" novalidate>
      <div>
        <label for="admin-password" class="label">Admin password</label>
        <input
          id="admin-password"
          type="password"
          class="input"
          autocomplete="current-password"
          [formField]="loginForm.password"
          [attr.aria-describedby]="loginForm.password().invalid() ? 'admin-password-errors' : null"
        />
        <ui-field-errors [field]="loginForm.password" errorId="admin-password-errors" />
      </div>
      <ui-error-message [message]="error()" />
      <button type="submit" class="btn btn-secondary" [disabled]="busy()">
        {{ busy() ? 'Logging in…' : 'Log in as admin' }}
      </button>
    </form>
  `,
})
export class UiAdminLoginForm {
  readonly busy = input(false);
  readonly error = input<string | null>(null);
  readonly loggedIn = output<string>();

  private readonly model = signal({ password: '' });
  protected readonly loginForm = form(this.model, (path) => {
    required(path.password, { message: 'Enter the admin password.' });
  });

  protected onSubmit(event: Event): void {
    event.preventDefault();
    void submit(this.loginForm, async () => {
      this.loggedIn.emit(this.model().password);
      return undefined;
    });
  }
}
