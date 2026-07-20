import { describe, it, expect } from 'vitest';
import { parseCurrency } from '../components/primitives/MoneyField';

describe('parseCurrency', () => {
  it('returns 0 for empty string', () => {
    expect(parseCurrency('')).toBe(0);
  });

  it('parses plain digits', () => {
    expect(parseCurrency('250000')).toBe(250000);
  });

  it('parses comma-formatted number', () => {
    expect(parseCurrency('250,000')).toBe(250000);
  });

  it('parses large comma-formatted number', () => {
    expect(parseCurrency('1,000,000')).toBe(1000000);
  });

  it('strips dollar sign', () => {
    expect(parseCurrency('$250,000')).toBe(250000);
  });

  it('returns 0 for non-numeric string', () => {
    expect(parseCurrency('abc')).toBe(0);
  });

  it('returns 0 for whitespace only', () => {
    expect(parseCurrency('   ')).toBe(0);
  });

  it('strips non-digit characters and parses remaining digits', () => {
    expect(parseCurrency('1a2b3c')).toBe(123);
  });
});
