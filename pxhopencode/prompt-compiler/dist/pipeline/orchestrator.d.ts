import type { CompilerOptions, CompilerResult, StageMetric } from '../types.js';
export declare class Pipeline {
    private options;
    private metrics;
    constructor(options?: Partial<CompilerOptions>);
    compile(input: string): CompilerResult;
    setOptions(options: Partial<CompilerOptions>): void;
    getMetrics(): StageMetric[];
}
//# sourceMappingURL=orchestrator.d.ts.map