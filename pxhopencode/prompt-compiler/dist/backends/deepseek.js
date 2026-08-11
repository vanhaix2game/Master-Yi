import { BaseGenerator } from './base.js';
export class DeepSeekGenerator extends BaseGenerator {
    name = 'deepseek';
    generate(ir) {
        const parts = [];
        if (ir.safety.preserveBehavior || ir.safety.noBreakingChanges) {
            parts.push('IMPORTANT: Preserve existing behavior. No breaking changes.');
        }
        const intentStr = this.formatIntents(ir);
        if (intentStr && intentStr !== 'unknown') {
            parts.push(intentStr.charAt(0).toUpperCase() + intentStr.slice(1) + '.');
        }
        const context = this.buildContext(ir);
        if (context.length > 0)
            parts.push(context.join('\n'));
        const instructions = this.buildInstructions(ir);
        if (instructions.length > 0) {
            parts.push('Requirements:');
            parts.push(instructions.join('\n'));
        }
        const safety = this.buildSafetyRules(ir);
        if (safety)
            parts.push(safety);
        let prompt = parts.join('\n\n');
        if (ir.outputStyle === 'concise') {
            prompt = 'Be concise. ' + prompt;
        }
        else if (ir.outputStyle === 'detailed') {
            prompt = 'Be thorough. ' + prompt;
        }
        return prompt.trim();
    }
}
//# sourceMappingURL=deepseek.js.map