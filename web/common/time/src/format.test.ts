import { beforeEach, describe, afterEach, it, expect } from '@jest/globals';
import { format } from './format';
import timezoneMock from 'timezone-mock';
describe('format', () => {
  beforeEach(() => {
    timezoneMock.register('Etc/GMT+8');
  });
  afterEach(() => {
    timezoneMock.unregister();
  });
  it('format time timestamp', () => {
    // eslint-disable-next-line  numeric-separators-style
    expect(format(1677554648753)).toBe('2023-02-27 19:24:08');
  });
  it('format time string', () => {
    expect(format('2023-01-19T19:04:15.759225Z')).toBe('2023-01-19 11:04:15');
  });
  it('format time empty', () => {
    expect(format(null)).toBe('~');
    // eslint-disable-next-line no-useless-undefined
    expect(format(undefined)).toBe('~');
  });
});
