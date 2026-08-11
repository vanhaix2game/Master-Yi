import type { Backend, BackendGenerator, PromptIR } from '../types.js';

export abstract class BaseGenerator implements BackendGenerator {
  abstract name: Backend;
  abstract generate(ir: PromptIR): string;

  protected buildContext(ir: PromptIR): string[] {
    const lines: string[] = [];

    if (ir.target.languages.length > 0) lines.push(`Language: ${ir.target.languages.join(', ')}`);
    if (ir.target.frameworks.length > 0) lines.push(`Framework: ${ir.target.frameworks.join(', ')}`);
    if (ir.target.libraries.length > 0) lines.push(`Libraries: ${ir.target.libraries.join(', ')}`);
    if (ir.target.platforms.length > 0) lines.push(`Platform: ${ir.target.platforms.join(', ')}`);

    return lines;
  }

  protected buildInstructions(ir: PromptIR): string[] {
    const lines: string[] = [];

    for (const c of ir.constraints) {
      lines.push(`- ${c.replace(/_/g, ' ')}`);
    }

    if (ir.safety.preserveBehavior) lines.push('- preserve existing behavior');
    if (ir.safety.noBreakingChanges) lines.push('- no breaking changes');
    if (ir.safety.backwardCompatible) lines.push('- backward compatible');

    return lines;
  }

  protected buildSafetyRules(ir: PromptIR): string {
    const rules: string[] = [];
    if (ir.safety.preserveBehavior) rules.push('CRITICAL: Preserve existing behavior');
    if (ir.safety.noBreakingChanges) rules.push('CRITICAL: No breaking changes');
    if (ir.safety.backwardCompatible) rules.push('CRITICAL: Backward compatible');
    return rules.join('\n');
  }

  protected formatIntents(ir: PromptIR): string {
    return ir.intents.map(i => i.replace(/_/g, ' ')).join(', ');
  }
}
