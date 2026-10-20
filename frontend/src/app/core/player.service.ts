import { Service, computed, signal } from '@angular/core';
import { browserStorage } from './browser-storage';

const NAME_KEY = 'kiko.username';
const ID_KEY = 'kiko.playerId';

/** The local player's identity. It is stored in the browser so reloads keep the same player. */
@Service()
export class PlayerService {
  private readonly _name = signal(browserStorage.get(NAME_KEY) ?? '');

  readonly name = this._name.asReadonly();
  readonly hasName = computed(() => this._name().length > 0);
  readonly id = this.loadOrCreateId();

  setName(name: string): void {
    const trimmed = name.trim();
    this._name.set(trimmed);
    browserStorage.set(NAME_KEY, trimmed);
  }

  private loadOrCreateId(): string {
    const existing = browserStorage.get(ID_KEY);
    if (existing) {
      return existing;
    }
    const id = crypto.randomUUID();
    browserStorage.set(ID_KEY, id);
    return id;
  }
}
