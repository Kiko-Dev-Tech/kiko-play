import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { PlayerService } from './core/player.service';
import { UiAppHeader } from './shared/ui/ui-app-header';

/** The bootstrap shell. It is the only component without a ui-/page- selector. */
@Component({
  selector: 'app-root',
  imports: [RouterOutlet, UiAppHeader],
  template: `
    <ui-app-header [username]="player.name()" />
    <main class="mx-auto max-w-6xl px-4 py-8">
      <router-outlet />
    </main>
  `,
})
export class App {
  protected readonly player = inject(PlayerService);
}
