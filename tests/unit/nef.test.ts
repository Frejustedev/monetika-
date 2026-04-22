import { describe, it, expect } from 'vitest';
import { levelFromScore } from '@/lib/scoring/nef';

describe('levelFromScore', () => {
  it('classe 0-399 comme "building"', () => {
    expect(levelFromScore(0)).toBe('building');
    expect(levelFromScore(399)).toBe('building');
  });
  it('classe 400-599 comme "average"', () => {
    expect(levelFromScore(400)).toBe('average');
    expect(levelFromScore(599)).toBe('average');
  });
  it('classe 600-799 comme "good"', () => {
    expect(levelFromScore(600)).toBe('good');
    expect(levelFromScore(799)).toBe('good');
  });
  it('classe 800-1000 comme "excellent"', () => {
    expect(levelFromScore(800)).toBe('excellent');
    expect(levelFromScore(1000)).toBe('excellent');
  });
});
