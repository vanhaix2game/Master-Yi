import type { Constraint, StageMetric } from '../types.js';
import { DictionaryManager } from '../dictionaries/index.js';

const dict = new DictionaryManager();

export function extractConstraints(input: string): { constraints: Constraint[]; metric: StageMetric } {
  const t0 = performance.now();
  const constraints: Set<Constraint> = new Set();

  const patterns = dict.getConstraintPatterns();

  for (const pattern of patterns) {
    for (const regex of pattern.patterns) {
      if (regex.test(input)) {
        constraints.add(pattern.constraint);
        break;
      }
    }
  }

  const ms = performance.now() - t0;
  return {
    constraints: [...constraints],
    metric: { name: 'ConstraintExtractor', ms, inputLength: input.length, outputLength: constraints.size },
  };
}
