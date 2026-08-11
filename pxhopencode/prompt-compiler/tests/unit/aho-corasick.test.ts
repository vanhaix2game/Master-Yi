import { describe, it, expect } from 'vitest';
import { AhoCorasick } from '../../src/engine/aho-corasick.js';

describe('AhoCorasick', () => {
  it('should find single pattern', () => {
    const ac = AhoCorasick.fromEntries([
      ['fix bug', 'fix bug', 1.0],
    ]);
    const matches = ac.search('please fix bug in the code');
    expect(matches.length).toBe(1);
    expect(matches[0].output).toBe('fix bug');
    expect(matches[0].start).toBe(7);
  });

  it('should find multiple patterns', () => {
    const ac = AhoCorasick.fromEntries([
      ['react', 'React', 1.0],
      ['typescript', 'TypeScript', 1.0],
    ]);
    const matches = ac.search('building with react and typescript');
    expect(matches.length).toBe(2);
  });

  it('should find overlapping patterns', () => {
    const ac = AhoCorasick.fromEntries([
      ['react', 'React', 1.0],
      ['react native', 'React Native', 1.0],
    ]);
    const matches = ac.search('use react native');
    expect(matches.length).toBeGreaterThanOrEqual(2);
  });

  it('should return empty for no match', () => {
    const ac = AhoCorasick.fromEntries([['python', 'Python', 1.0]]);
    expect(ac.search('I love javascript').length).toBe(0);
  });

  it('should return unique matches', () => {
    const ac = AhoCorasick.fromEntries([
      ['bug', 'bug', 1.0],
      ['fix bug', 'fix bug', 1.0],
    ]);
    const matches = ac.searchUnique('fix bug in the code');
    const unique = new Set(matches.map(m => `${m.start}:${m.end}`));
    expect(unique.size).toBe(matches.length);
  });

  it('should be case insensitive', () => {
    const ac = AhoCorasick.fromEntries([['TypeScript', 'TypeScript', 1.0]]);
    expect(ac.search('TYPESCRIPT').length).toBe(1);
    expect(ac.search('typescript').length).toBe(1);
  });

  it('should handle large pattern sets', () => {
    const entries: Array<[string, string, number]> = [];
    for (let i = 0; i < 1000; i++) {
      entries.push([`pattern${i}`, `Pattern${i}`, 1.0]);
    }
    const ac = AhoCorasick.fromEntries(entries);
    const matches = ac.search('looking for pattern42 here');
    expect(matches.some(m => m.pattern === 'pattern42')).toBe(true);
    expect(ac.getSize()).toBe(1000);
  });
});
