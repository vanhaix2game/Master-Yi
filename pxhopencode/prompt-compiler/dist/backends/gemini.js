import { BaseGenerator } from './base.js';
export class GeminiGenerator extends BaseGenerator {
    name = 'gemini';
    generate(ir) {
        const lines = [];
        if (ir.intents.length > 0 && ir.intents[0] !== 'unknown') {
            lines.push(`You are a software engineer. ${this.formatIntents(ir)}.`);
        }
        const context = this.buildContext(ir);
        if (context.length > 0) {
            lines.push('Context:');
            for (const c of context)
                lines.push(`- ${c}`);
        }
        const instructions = this.buildInstructions(ir);
        if (instructions.length > 0) {
            lines.push('Constraints:');
            for (const i of instructions)
                lines.push(i);
        }
        if (ir.safety.preserveBehavior)
            lines.push('CRITICAL: Preserve existing behavior throughout.');
        if (ir.safety.noBreakingChanges)
            lines.push('CRITICAL: No breaking changes allowed.');
        if (ir.files.length > 0) {
            lines.push('Relevant files:');
            for (const f of ir.files)
                lines.push(`- ${f.path}`);
        }
        let prompt = lines.join('\n');
        if (ir.outputStyle === 'concise')
            prompt += '\n\nBe concise.';
        return prompt.trim();
    }
}
//# sourceMappingURL=gemini.js.map