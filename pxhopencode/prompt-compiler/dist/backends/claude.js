import { BaseGenerator } from './base.js';
export class ClaudeGenerator extends BaseGenerator {
    name = 'claude';
    generate(ir) {
        const lines = [];
        const intentStr = this.formatIntents(ir);
        if (intentStr && intentStr !== 'unknown') {
            lines.push(`# Task: ${intentStr}`);
        }
        const context = this.buildContext(ir);
        if (context.length > 0) {
            lines.push('\n## Context');
            for (const c of context)
                lines.push(`- ${c}`);
        }
        const instructions = this.buildInstructions(ir);
        if (instructions.length > 0) {
            lines.push('\n## Requirements');
            for (const i of instructions)
                lines.push(i);
        }
        if (ir.safety.preserveBehavior || ir.safety.noBreakingChanges) {
            lines.push('\n## Critical Rules');
            if (ir.safety.preserveBehavior)
                lines.push('- ⚠ Do NOT change existing behavior');
            if (ir.safety.noBreakingChanges)
                lines.push('- ⚠ No breaking changes');
            if (ir.safety.backwardCompatible)
                lines.push('- ⚠ Must be backward compatible');
        }
        if (ir.files.length > 0) {
            lines.push('\n## Files');
            for (const f of ir.files)
                lines.push(`- ${f.path} (${f.action})`);
        }
        if (ir.target.frameworks.length > 0 || ir.target.libraries.length > 0) {
            lines.push('\n## Stack');
            if (ir.target.frameworks.length > 0)
                lines.push(`Framework: ${ir.target.frameworks.join(', ')}`);
            if (ir.target.libraries.length > 0)
                lines.push(`Libraries: ${ir.target.libraries.join(', ')}`);
        }
        let prompt = lines.join('\n');
        if (ir.outputStyle === 'concise') {
            prompt += '\n\nKeep response concise and focused.';
        }
        return prompt.trim();
    }
}
//# sourceMappingURL=claude.js.map