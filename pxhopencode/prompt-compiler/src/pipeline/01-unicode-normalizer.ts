import { normalizeUnicode } from '../utils/unicode.js';
import type { StageMetric } from '../types.js';

export function unicodeNormalize(input: string): { output: string; metric: StageMetric } {
  const t0 = performance.now();
  const output = normalizeUnicode(input);
  const ms = performance.now() - t0;
  return {
    output,
    metric: { name: 'UnicodeNormalizer', ms, inputLength: input.length, outputLength: output.length },
  };
}
