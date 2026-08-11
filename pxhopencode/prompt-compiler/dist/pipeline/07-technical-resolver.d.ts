import type { StageMetric } from '../types.js';
export declare function resolveTechnicalTerms(input: string, _lexemes: unknown[]): {
    output: string;
    resolved: Array<{
        original: string;
        normalized: string;
    }>;
    metric: StageMetric;
};
export declare function resolveFileExtension(ext: string): string | null;
//# sourceMappingURL=07-technical-resolver.d.ts.map