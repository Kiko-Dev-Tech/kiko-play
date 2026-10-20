import { Service, signal } from '@angular/core';
import { browserStorage } from './browser-storage';

const VOLUME_KEY = 'kiko.videoVolume';
const DEFAULT_VOLUME = 40;

/** The video volume (0–100) of this browser, remembered across visits. */
@Service()
export class VolumeService {
  private readonly _volume = signal(loadVolume());

  readonly volume = this._volume.asReadonly();

  setVolume(volume: number): void {
    const clamped = Math.min(100, Math.max(0, Math.round(volume)));
    this._volume.set(clamped);
    browserStorage.set(VOLUME_KEY, String(clamped));
  }
}

function loadVolume(): number {
  const stored = Number(browserStorage.get(VOLUME_KEY) ?? NaN);
  return Number.isFinite(stored) && stored >= 0 && stored <= 100 ? stored : DEFAULT_VOLUME;
}
