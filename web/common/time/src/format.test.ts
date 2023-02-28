import { describe, expect, it } from 'vitest';
import { format } from './format';

describe('format', () => {
  it('format time timestamp', () => {
    expect(format(1677554648753)).toBe('2023-02-28 11:24:08');
  });
  it('format time string', () => {
    expect(format('2023-01-19T19:04:15.759225Z')).toBe('2023-01-20 03:04:15');
  });
  it('format time empty', () => {
    expect(format(null)).toBe('~');
    expect(format(undefined)).toBe('~');
  });
});
