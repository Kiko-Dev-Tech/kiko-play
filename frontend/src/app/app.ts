import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { PlayerService } from './core/player.service';
import { SoundCheckService } from './core/sound-check.service';
import { VolumeService } from './core/volume.service';
import { UiAppHeader } from './shared/ui/ui-app-header';
import { UiSoundCheckDialog } from './shared/ui/ui-sound-check-dialog';

/** The bootstrap shell. It is the only component without a ui-/page- selector. */
@Component({
  selector: 'app-root',
  imports: [RouterOutlet, UiAppHeader, UiSoundCheckDialog],
  template: `
    <ui-app-header
      [username]="player.name()"
      [volume]="volumes.volume()"
      (soundCheck)="soundCheck.open()"
    />
    <main class="mx-auto max-w-6xl px-4 py-8">
      <router-outlet />
    </main>
    <ui-sound-check-dialog
      [open]="soundCheck.isOpen()"
      [volume]="volumes.volume()"
      (volumeChanged)="volumes.setVolume($event)"
      (closed)="soundCheck.close()"
    />
  `,
})
export class App {
  protected readonly player = inject(PlayerService);
  protected readonly volumes = inject(VolumeService);
  protected readonly soundCheck = inject(SoundCheckService);
}
