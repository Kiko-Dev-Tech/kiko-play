import { Service } from '@angular/core';

const API_URL = 'https://www.youtube.com/iframe_api';

/** The globals the YouTube script reads and writes. */
type YoutubeWindow = Window & {
  YT?: typeof YT;
  onYouTubeIframeAPIReady?: () => void;
};

/** Loads the YouTube IFrame Player API once, on first use. */
@Service()
export class YoutubeApiService {
  private loading: Promise<typeof YT> | null = null;

  load(): Promise<typeof YT> {
    this.loading ??= new Promise<typeof YT>((resolve, reject) => {
      const win = window as YoutubeWindow;
      if (win.YT?.Player) {
        resolve(win.YT);
        return;
      }
      const previous = win.onYouTubeIframeAPIReady;
      win.onYouTubeIframeAPIReady = () => {
        previous?.();
        resolve(win.YT as typeof YT);
      };
      const script = document.createElement('script');
      script.src = API_URL;
      script.async = true;
      script.onerror = () => {
        this.loading = null;
        reject(new Error('The YouTube player could not be loaded'));
      };
      document.head.appendChild(script);
    });
    return this.loading;
  }
}
