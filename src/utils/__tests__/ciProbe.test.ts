import { describe, expect, it } from 'vitest';
import { add, isEven } from '../ciProbe';

describe('ciProbe', () => {
  it('adds two numbers', () => {
    expect(add(2, 3)).toBe(5);
  });

  it('checks even numbers', () => {
    expect(isEven(2)).toBe(true);
    expect(isEven(3)).toBe(false);
  });
});
