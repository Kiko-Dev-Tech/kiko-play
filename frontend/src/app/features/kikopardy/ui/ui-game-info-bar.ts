import { Component, computed, input, output, signal } from '@angular/core';

/** Board name, join code with a copyable link, and the connection status. */
@Component({
  selector: 'ui-game-info-bar',
  template: `
    <div
      class="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-stage-900 px-4 py-3"
    >
      <div class="flex flex-wrap items-center gap-3">
        <h1 class="font-display text-xl tracking-wide text-gold-400 uppercase">
          {{ boardName() }}
        </h1>
        <span
          class="rounded-lg bg-stage-700 px-3 py-1 font-mono text-lg tracking-widest text-white"
        >
          <span class="sr-only">Join code </span>{{ code() }}
        </span>
        @if (showInvite()) {
          <button type="button" class="btn btn-ghost btn-sm" (click)="copyLink()">
            {{ copied() ? 'Link copied!' : 'Copy invite link' }}
          </button>
        }
      </div>
      <div class="flex items-center gap-3">
        <span class="flex items-center gap-2 text-sm" role="status">
          <span
            class="size-2.5 rounded-full"
            [class]="connected() ? 'bg-emerald-400' : 'bg-rose-400 animate-pulse'"
          ></span>
          {{ connected() ? 'Connected' : 'Reconnecting…' }}
        </span>
        @if (showEnd()) {
          <button type="button" class="btn btn-danger btn-sm" (click)="endGame.emit()">
            End game
          </button>
        }
      </div>
    </div>
  `,
})
export class UiGameInfoBar {
  readonly boardName = input('');
  readonly code = input.required<string>();
  readonly connected = input(false);
  readonly showInvite = input(false);
  readonly showEnd = input(false);
  readonly endGame = output();

  protected readonly copied = signal(false);
  private readonly inviteLink = computed(() => `${location.origin}/kikopardy/join/${this.code()}`);

  protected async copyLink(): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.inviteLink());
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 2000);
    } catch {
      prompt('Copy this invite link:', this.inviteLink());
    }
  }
}
