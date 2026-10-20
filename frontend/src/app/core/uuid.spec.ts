import { uuid } from './uuid';

const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

describe('uuid', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('uses crypto.randomUUID when available', () => {
    expect(uuid()).toMatch(UUID_V4);
  });

  it('falls back to getRandomValues on insecure pages without randomUUID', () => {
    const insecureCrypto = { getRandomValues: crypto.getRandomValues.bind(crypto) };
    vi.stubGlobal('crypto', insecureCrypto);
    const ids = new Set(Array.from({ length: 100 }, () => uuid()));
    expect(ids.size).toBe(100);
    for (const id of ids) {
      expect(id).toMatch(UUID_V4);
    }
  });
});
