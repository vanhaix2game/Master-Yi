export interface BenchmarkResult {
    name: string;
    iterations: number;
    totalMs: number;
    avgMs: number;
    minMs: number;
    maxMs: number;
    opsPerSec: number;
    memoryBytes?: number;
}
export declare class Benchmark {
    private results;
    run(name: string, fn: () => void | Promise<void>, iterations?: number): Promise<BenchmarkResult>;
    getResults(): BenchmarkResult[];
    printResults(): void;
    clear(): void;
}
export declare function measureMemory(fn: () => void): number;
//# sourceMappingURL=benchmark.d.ts.map