import { describe, expect, it } from 'vitest';
import { formatDistance } from '../units';

describe('formatDistance', () => {
  it('formats metric distances under 10 km with one decimal', () => {
    expect(formatDistance(3.94, 'metric')).toBe('3.9 km');
    expect(formatDistance(0.5, 'metric')).toBe('0.5 km');
  });

  it('formats metric distances >= 10 km as whole numbers', () => {
    expect(formatDistance(18.2, 'metric')).toBe('18 km');
    expect(formatDistance(10.0, 'metric')).toBe('10 km');
  });

  it('formats imperial distances under 10 mi with one decimal', () => {
    // 3 km ≈ 1.864 mi -> 1.9 mi
    expect(formatDistance(3, 'imperial')).toBe('1.9 mi');
  });

  it('formats imperial distances >= 10 mi as whole numbers', () => {
    // 32 km ≈ 19.884 mi -> 20 mi
    expect(formatDistance(32, 'imperial')).toBe('20 mi');
  });

  it('returns em dash for invalid or non-positive inputs', () => {
    expect(formatDistance(NaN, 'metric')).toBe('—');
    expect(formatDistance(-1, 'imperial')).toBe('—');
    expect(formatDistance(0, 'metric')).toBe('—');
  });
});
