import type { StageMetric } from '../types.js';
import { DictionaryManager } from '../dictionaries/index.js';

const dict = new DictionaryManager();

export function normalizePhrases(input: string): { output: string; normalized: Array<{ from: string; to: string }>; metric: StageMetric } {
  const t0 = performance.now();
  const matches = dict.getPhraseMatcher().searchUnique(input);
  const normalized: Array<{ from: string; to: string }> = [];
  let output = input;

  const sorted = matches.sort((a, b) => {
    const alen = a.end - a.start;
    const blen = b.end - b.start;
    if (blen !== alen) return blen - alen;
    return b.confidence - a.confidence;
  });

  const appliedRanges: Array<[number, number]> = [];

  for (const match of sorted) {
    const overlap = appliedRanges.some(([s, e]) => match.start < e && match.end > s);
    if (overlap) continue;

    const original = input.slice(match.start, match.end);
    if (original !== match.output) {
      output = output.slice(0, match.start) + match.output + output.slice(match.end);
      normalized.push({ from: original, to: match.output });
      appliedRanges.push([match.start, match.start + match.output.length]);
    }
  }

  const ms = performance.now() - t0;
  return {
    output,
    normalized,
    metric: { name: 'PhraseNormalizer', ms, inputLength: input.length, outputLength: output.length },
  };
}
