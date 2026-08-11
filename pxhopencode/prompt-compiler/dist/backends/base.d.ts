import type { Backend, BackendGenerator, PromptIR } from '../types.js';
export declare abstract class BaseGenerator implements BackendGenerator {
    abstract name: Backend;
    abstract generate(ir: PromptIR): string;
    protected buildContext(ir: PromptIR): string[];
    protected buildInstructions(ir: PromptIR): string[];
    protected buildSafetyRules(ir: PromptIR): string;
    protected formatIntents(ir: PromptIR): string;
}
//# sourceMappingURL=base.d.ts.map