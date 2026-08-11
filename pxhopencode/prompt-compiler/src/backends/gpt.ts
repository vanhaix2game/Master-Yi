import { BaseGenerator } from './base.js';
import type { PromptIR } from '../types.js';

export class GPTGenerator extends BaseGenerator {
  name = 'gpt' as const;

  generate(ir: PromptIR): string {
    const parts: string[] = [];

    parts.push('# Role');
    parts.push('You are an expert software engineer.');

    const intentStr = this.formatIntents(ir);
    if (intentStr && intentStr !== 'unknown') {
      parts.push(`\n# Objective\n${intentStr}.`);
    }

    const context = this.buildContext(ir);
    if (context.length > 0) {
      parts.push(`\n# Context\n${context.join('\n')}`);
    }

    const instructions = this.buildInstructions(ir);
    if (instructions.length > 0) {
      parts.push(`\n# Constraints\n${instructions.join('\n')}`);
    }

    const safety = this.buildSafetyRules(ir);
    if (safety) parts.push(`\n# Safety\n${safety}`);

    if (ir.files.length > 0) {
      parts.push(`\n# Files\n${ir.files.map(f => `- ${f.path}`).join('\n')}`);
    }

    let prompt = parts.join('\n');

    if (ir.outputStyle === 'concise') {
      prompt += '\n\nBe concise. Respond with minimal text.';
    } else if (ir.outputStyle === 'detailed') {
      prompt += '\n\nBe thorough and explain your reasoning.';
    }

    return prompt.trim();
  }
}
