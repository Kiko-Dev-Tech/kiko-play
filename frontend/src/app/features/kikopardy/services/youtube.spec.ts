import { formatTime, parseTime, youtubeClip, youtubeVideoId } from './youtube';

describe('youtube', () => {
  it.each([
    'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    'https://youtube.com/watch?v=dQw4w9WgXcQ&list=abc',
    'https://m.youtube.com/watch?v=dQw4w9WgXcQ',
    'https://youtu.be/dQw4w9WgXcQ?si=xyz',
    'https://www.youtube.com/shorts/dQw4w9WgXcQ',
    'https://www.youtube.com/embed/dQw4w9WgXcQ',
    'https://music.youtube.com/watch?v=dQw4w9WgXcQ',
  ])('finds the video ID in %s', (url) => {
    expect(youtubeVideoId(url)).toBe('dQw4w9WgXcQ');
  });

  it.each(['not a url', 'https://vimeo.com/123', 'https://youtube.com/watch?v=short', ''])(
    'rejects %s',
    (url) => {
      expect(youtubeVideoId(url)).toBeNull();
    },
  );

  it('builds a clip with start and end', () => {
    expect(youtubeClip('https://youtu.be/dQw4w9WgXcQ', 43, 50)).toEqual({
      videoId: 'dQw4w9WgXcQ',
      start: 43,
      end: 50,
    });
  });

  it('takes the start time from the link when none is set', () => {
    expect(youtubeClip('https://youtu.be/dQw4w9WgXcQ?t=1m30s')).toEqual({
      videoId: 'dQw4w9WgXcQ',
      start: 90,
    });
  });

  it('returns no clip for invalid links', () => {
    expect(youtubeClip('https://vimeo.com/123')).toBeNull();
  });

  it('parses and formats times', () => {
    expect(parseTime('90')).toBe(90);
    expect(parseTime('1:30')).toBe(90);
    expect(parseTime('1:02:03')).toBe(3723);
    expect(parseTime('')).toBeUndefined();
    expect(parseTime('abc')).toBeNull();
    expect(formatTime(90)).toBe('1:30');
    expect(formatTime(3723)).toBe('1:02:03');
    expect(formatTime(undefined)).toBe('');
  });
});
