import { describe, expect, it } from 'vitest';

// Minimal placeholder test to keep CI green when no other tests are present.
// Dev trigger: non-functional change to trigger preview deploy via CI.
describe('ci placeholder', () => {
  it('runs a trivial assertion', () => {
    expect(true).toBe(true);
  });
});
