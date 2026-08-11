import { describe, it, expect } from 'vitest';
import { DictionaryManager, getDictionaryManager, resetDictionaryManager } from '../../src/dictionaries/index.js';

describe('DictionaryManager', () => {
  it('should load all dictionaries', () => {
    const dict = new DictionaryManager();
    const stats = dict.getStats();
    expect(stats.technicalTerms).toBeGreaterThan(100);
    expect(stats.phraseEntries).toBeGreaterThan(50);
    expect(stats.fillerEntries).toBeGreaterThan(20);
    expect(stats.intentPatterns).toBeGreaterThan(10);
    expect(stats.constraintPatterns).toBeGreaterThan(10);
  });

  it('should resolve technical terms via trie', () => {
    const dict = new DictionaryManager();
    const trie = dict.getTechnicalTrie();
    const r1 = trie.search('react');
    expect(r1.output).toBe('React');
    const r2 = trie.search('typescript');
    expect(r2.output).toBe('TypeScript');
  });

  it('should match phrases via aho-corasick', () => {
    const dict = new DictionaryManager();
    const matcher = dict.getPhraseMatcher();
    const matches = matcher.search('đọc project và sửa bug');
    expect(matches.some(m => m.output === 'analyze project')).toBe(true);
    expect(matches.some(m => m.output === 'fix bug')).toBe(true);
  });

  it('should detect filler words', () => {
    const dict = new DictionaryManager();
    const matcher = dict.getFillerMatcher();
    const matches = matcher.search('hãy giúp tôi fix bug');
    expect(matches.length).toBeGreaterThan(0);
  });

  it('should match intent patterns', () => {
    const dict = new DictionaryManager();
    const patterns = dict.getIntentPatterns();
    const hasFixBug = patterns.some(p =>
      p.intent === 'fix_bug' && p.patterns.some(re => re.test('fix bug in login'))
    );
    expect(hasFixBug).toBe(true);
  });

  it('should match constraint patterns', () => {
    const dict = new DictionaryManager();
    const patterns = dict.getConstraintPatterns();
    const hasPreserve = patterns.some(p =>
      p.constraint === 'preserve_behavior' && p.patterns.some(re => re.test('giữ nguyên hành vi'))
    );
    expect(hasPreserve).toBe(true);
  });

  it('should support hot reload', () => {
    const dict = new DictionaryManager();
    const before = dict.getStats().technicalTerms;
    dict.reload();
    expect(dict.getStats().technicalTerms).toBe(before);
  });

  it('should support singleton pattern', () => {
    resetDictionaryManager();
    const d1 = getDictionaryManager();
    const d2 = getDictionaryManager();
    expect(d1).toBe(d2);
  });
});
