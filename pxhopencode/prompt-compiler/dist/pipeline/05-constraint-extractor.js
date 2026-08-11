import { DictionaryManager } from '../dictionaries/index.js';
const dict = new DictionaryManager();
export function extractConstraints(input) {
    const t0 = performance.now();
    const constraints = new Set();
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
//# sourceMappingURL=05-constraint-extractor.js.map