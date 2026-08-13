import { describe, expect, it } from 'vitest';
import { calcStatus } from './helpers';

describe('payment status helper', () => {
  it('marks paid when balance is zero', () => {
    expect(calcStatus(1000, 1000)).toBe('PAID');
  });

  it('marks partial when advance is less than total', () => {
    expect(calcStatus(1000, 200)).toBe('PARTIAL');
  });

  it('marks pending when no advance', () => {
    expect(calcStatus(1000, 0)).toBe('PENDING');
  });
});
