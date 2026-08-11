import type { Constraint, StageMetric } from '../types.js';
export declare function analyzeSemantics(input: string, _lexemes: unknown[], constraints: Constraint[]): {
    normalized: string;
    actions: string[];
    metric: StageMetric;
};
export declare function normalizeDevPhrases(input: string): {
    output: string;
    replacements: number;
};
//# sourceMappingURL=06-semantic-analyzer.d.ts.map