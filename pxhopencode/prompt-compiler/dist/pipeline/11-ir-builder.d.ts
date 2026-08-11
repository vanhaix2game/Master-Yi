import type { PromptIR, Intent, Constraint, Lexeme } from '../types.js';
export declare function buildIR(params: {
    raw: string;
    normalized: string;
    intents: Intent[];
    constraints: Constraint[];
    lexemes: Lexeme[];
    actions: string[];
}): PromptIR;
//# sourceMappingURL=11-ir-builder.d.ts.map