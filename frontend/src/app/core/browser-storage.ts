/** localStorage access that never throws, e.g. in private windows or with blocked site data. */
export const browserStorage = {
  get(key: string): string | null {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  set(key: string, value: string): void {
    try {
      localStorage.setItem(key, value);
    } catch {
      // The value then only lives until the page is closed.
    }
  },
  remove(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch {
      // Nothing to clean up.
    }
  },
};
