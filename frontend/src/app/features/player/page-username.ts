import { Component, inject, input } from '@angular/core';
import { Router } from '@angular/router';
import { PlayerService } from '../../core/player.service';
import { UiUsernameForm } from './ui-username-form';

@Component({
  selector: 'page-username',
  imports: [UiUsernameForm],
  template: `
    <section class="mx-auto mt-12 max-w-md text-center">
      <h1 class="font-display text-4xl tracking-wide text-gold-400 uppercase">Welcome!</h1>
      <p class="mt-2 mb-8 text-slate-300">What should your friends call you?</p>
      <div class="card text-left">
        <ui-username-form [initialName]="player.name()" (submitted)="saveName($event)" />
      </div>
    </section>
  `,
})
export class PageUsername {
  /** Where to continue after choosing a name, set by the username guard. */
  readonly returnUrl = input<string>();

  protected readonly player = inject(PlayerService);
  private readonly router = inject(Router);

  protected saveName(name: string): void {
    this.player.setName(name);
    void this.router.navigateByUrl(this.returnUrl() ?? '/games');
  }
}
