export class Benchmark {
    results = [];
    async run(name, fn, iterations = 1000) {
        const times = [];
        for (let i = 0; i < iterations; i++) {
            const start = performance.now();
            await fn();
            const end = performance.now();
            times.push(end - start);
        }
        const totalMs = times.reduce((a, b) => a + b, 0);
        const avgMs = totalMs / times.length;
        const minMs = Math.min(...times);
        const maxMs = Math.max(...times);
        const opsPerSec = Math.round(1000 / avgMs);
        const result = { name, iterations, totalMs, avgMs, minMs, maxMs, opsPerSec };
        this.results.push(result);
        return result;
    }
    getResults() {
        return [...this.results];
    }
    printResults() {
        console.log('\n=== BENCHMARK RESULTS ===\n');
        for (const r of this.results) {
            console.log(`${r.name}:`);
            console.log(`  Iterations: ${r.iterations}`);
            console.log(`  Total: ${r.totalMs.toFixed(2)}ms`);
            console.log(`  Avg: ${r.avgMs.toFixed(4)}ms`);
            console.log(`  Min: ${r.minMs.toFixed(4)}ms`);
            console.log(`  Max: ${r.maxMs.toFixed(4)}ms`);
            console.log(`  Ops/sec: ${r.opsPerSec.toLocaleString()}`);
            if (r.memoryBytes !== undefined) {
                console.log(`  Memory: ${(r.memoryBytes / 1024).toFixed(1)}KB`);
            }
            console.log('');
        }
        console.log('========================\n');
    }
    clear() {
        this.results = [];
    }
}
export function measureMemory(fn) {
    try {
        const proc = globalThis;
        if (proc.gc?.()) { }
        const before = typeof proc.process?.memoryUsage === 'function' ? proc.process.memoryUsage().heapUsed : 0;
        fn();
        const after = typeof proc.process?.memoryUsage === 'function' ? proc.process.memoryUsage().heapUsed : 0;
        return Math.max(0, after - before);
    }
    catch {
        return 0;
    }
}
//# sourceMappingURL=benchmark.js.map