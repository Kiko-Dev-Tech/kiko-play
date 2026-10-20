import { Component, computed, input } from '@angular/core';
import type { FieldTree } from '@angular/forms/signals';

/** Shows the validation errors of a signal form field once it has been touched. */
@Component({
  selector: 'ui-field-errors',
  template: `
    @if (messages().length) {
      <p [id]="errorId()" class="mt-1 text-sm text-rose-300">{{ messages().join(' ') }}</p>
    }
  `,
})
export class UiFieldErrors {
  readonly field = input.required<FieldTree<unknown>>();
  readonly errorId = input<string>();

  protected readonly messages = computed(() => {
    const state = this.field()();
    return state.touched() ? state.errors().map((e) => e.message ?? 'Invalid value') : [];
  });
}
