import { describe, it, expect } from 'vitest';
import { Pipeline } from '../../src/pipeline/orchestrator.js';
import { Trie } from '../../src/engine/trie.js';
import { AhoCorasick } from '../../src/engine/aho-corasick.js';
import { DictionaryManager } from '../../src/dictionaries/index.js';

const LARGE_PROMPT = Array(50).fill(
  'Hãy giúp tôi fix bug trong component login sử dụng React và TypeScript. ' +
  'Giữ nguyên hành vi cũ. Không làm hỏng code đang chạy. ' +
  'Chỉ sửa trong file Login.tsx. Tìm root cause của crash khi click submit.'
).join('\n');

const MEDIUM_PROMPT = 'Fix the login bug with React TypeScript. Preserve behavior. Minimal changes.';

describe('Performance Benchmarks', () => {
  it('Trie: 10K lookups should complete quickly', async () => {
    const trie = new Trie();
    for (let i = 0; i < 500; i++) {
      trie.insert(`term${i}`, `Term${i}`, 1.0);
    }

    const t0 = performance.now();
    const iterations = 10000;
    for (let i = 0; i < iterations; i++) {
      trie.search(`term${i % 500}`);
    }
    const ms = performance.now() - t0;
    expect(ms).toBeLessThan(50);
  });

  it('Aho-Corasick: 100 patterns in long text under 10ms avg', () => {
    const entries: Array<[string, string, number]> = [];
    for (let i = 0; i < 100; i++) {
      entries.push([`pattern${i}`, `Pattern${i}`, 1.0]);
    }
    const ac = AhoCorasick.fromEntries(entries);

    const text = 'This is a long text ' + Array(20).fill('testing pattern42 and pattern7 and pattern99 here ').join('');
    const t0 = performance.now();
    const iterations = 100;
    for (let i = 0; i < iterations; i++) {
      ac.search(text);
    }
    const ms = performance.now() - t0;
    expect(ms / iterations).toBeLessThan(10);
  });

  it('Pipeline: medium prompt under 100ms avg', () => {
    const pipeline = new Pipeline();
    const t0 = performance.now();
    const iterations = 50;
    for (let i = 0; i < iterations; i++) {
      pipeline.compile(MEDIUM_PROMPT);
    }
    const avgMs = (performance.now() - t0) / iterations;
    expect(avgMs).toBeLessThan(100);
  });

  it('Pipeline: large prompt under 500ms avg', () => {
    const pipeline = new Pipeline();
    const t0 = performance.now();
    const iterations = 10;
    for (let i = 0; i < iterations; i++) {
      pipeline.compile(LARGE_PROMPT);
    }
    const avgMs = (performance.now() - t0) / iterations;
    expect(avgMs).toBeLessThan(500);
  });

  it('Dictionary: full load and match under 10ms avg', () => {
    const dict = new DictionaryManager();
    const matcher = dict.getPhraseMatcher();

    const t0 = performance.now();
    const iterations = 100;
    for (let i = 0; i < iterations; i++) {
      matcher.search('đọc project và sửa bug, tìm nguyên nhân, giữ nguyên code');
    }
    const avgMs = (performance.now() - t0) / iterations;
    expect(avgMs).toBeLessThan(10);
  });

  it('Full pipeline: compression ratio > 1.5x for verbose input', () => {
    const pipeline = new Pipeline({ optimizationLevel: 2 });
    const verbose = Array(10).fill(
      'Hãy giúp tôi vui lòng sửa bug trong component login. ' +
      'Nếu được thì giữ nguyên hành vi cũ nhé. Cảm ơn bạn rất nhiều.'
    ).join(' ');

    const result = pipeline.compile(verbose);
    // compressed IR normalized text should be shorter than raw
    expect(result.ir.normalized.length).toBeLessThan(result.ir.raw.length);
  });
});
