import { TestBed } from '@angular/core/testing';
import { VolumeService } from './volume.service';

describe('VolumeService', () => {
  beforeEach(() => localStorage.clear());

  it('starts at 40% and remembers changes', () => {
    expect(TestBed.inject(VolumeService).volume()).toBe(40);
    TestBed.inject(VolumeService).setVolume(65);
    TestBed.resetTestingModule();
    expect(TestBed.inject(VolumeService).volume()).toBe(65);
  });

  it('keeps the volume between 0 and 100', () => {
    const volumes = TestBed.inject(VolumeService);
    volumes.setVolume(150);
    expect(volumes.volume()).toBe(100);
    volumes.setVolume(-5);
    expect(volumes.volume()).toBe(0);
  });

  it('ignores invalid stored values', () => {
    localStorage.setItem('kiko.videoVolume', 'loud');
    expect(TestBed.inject(VolumeService).volume()).toBe(40);
  });
});
