import { Service, signal } from '@angular/core';

/** Whether the Sound check dialog is open. It can be opened from the header or from a game. */
@Service()
export class SoundCheckService {
  private readonly _isOpen = signal(false);

  readonly isOpen = this._isOpen.asReadonly();

  open(): void {
    this._isOpen.set(true);
  }

  close(): void {
    this._isOpen.set(false);
  }
}
