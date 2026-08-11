import { describe, it, expect } from 'vitest';
import { Trie } from '../../src/engine/trie.js';

describe('Trie', () => {
  it('should store and retrieve entries', () => {
    const trie = new Trie();
    trie.insert('typescript', 'TypeScript', 1.0);
    trie.insert('three.js', 'Three.js', 1.0);

    const r1 = trie.search('typescript');
    expect(r1.found).toBe(true);
    expect(r1.output).toBe('TypeScript');

    const r2 = trie.search('three.js');
    expect(r2.found).toBe(true);
    expect(r2.output).toBe('Three.js');
  });

  it('should return not found for missing keys', () => {
    const trie = new Trie();
    trie.insert('react', 'React', 1.0);
    const r = trie.search('vue');
    expect(r.found).toBe(false);
    expect(r.output).toBeNull();
  });

  it('should do case-insensitive matching', () => {
    const trie = new Trie();
    trie.insert('TypeScript', 'TypeScript', 1.0);
    expect(trie.search('typescript').found).toBe(true);
    expect(trie.search('TYPESCRIPT').found).toBe(true);
  });

  it('should find longest match', () => {
    const trie = new Trie();
    trie.insert('react', 'React', 0.8);
    trie.insert('react native', 'React Native', 1.0);

    const r = trie.longestMatch('I use react native for mobile', 6);
    expect(r.length).toBe(12);
    expect(r.output).toBe('React Native');
  });

  it('should find all matches', () => {
    const trie = new Trie();
    trie.insert('react', 'React', 1.0);
    trie.insert('native', 'Native', 1.0);

    const matches = trie.findAllMatches('react native');
    expect(matches.length).toBe(2);
  });

  it('should support startsWith', () => {
    const trie = new Trie();
    trie.insert('typescript', 'TypeScript', 1.0);
    expect(trie.startsWith('type')).toBe(true);
    expect(trie.startsWith('typesc')).toBe(true);
    expect(trie.startsWith('xyz')).toBe(false);
  });

  it('should build from entries', () => {
    const trie = Trie.fromEntries([
      ['a', 'A', 1.0],
      ['b', 'B', 0.9],
    ]);
    expect(trie.getSize()).toBe(2);
    expect(trie.search('a').found).toBe(true);
    expect(trie.search('b').found).toBe(true);
  });
});
