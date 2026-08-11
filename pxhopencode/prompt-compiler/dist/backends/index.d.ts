import type { Backend, BackendGenerator, PromptIR } from '../types.js';
export declare function getGenerator(backend: Backend): BackendGenerator;
export declare function generatePrompt(ir: PromptIR, backend: Backend): string;
export declare function registerBackend(name: Backend, factory: () => BackendGenerator): void;
export declare function listBackends(): Backend[];
//# sourceMappingURL=index.d.ts.map