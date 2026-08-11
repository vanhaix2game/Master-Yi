import { BaseGenerator } from './base.js';
import type { PromptIR } from '../types.js';

export class OpenCodeGenerator extends BaseGenerator {
  name = 'opencode' as const;

  generate(ir: PromptIR): string {
    const lines: string[] = [
      'RULE:',
      '- Make the smallest safe change within TARGET.',
      '- Preserve working behavior and verify the result.',
      '- Update STATUS.md after source changes.',
    ];
    lines.push('', `TARGET:\n${ir.normalized || ir.raw}`);

    const context: string[] = [];
    const intents = ir.intents.filter(intent => intent !== 'unknown');
    const stack = [...ir.target.frameworks, ...ir.target.languages, ...ir.target.libraries, ...ir.target.platforms]
      .filter((value, index, values) => values.findIndex(candidate => candidate.toLowerCase() === value.toLowerCase()) === index);
    if (intents.length > 0) context.push(`intent=${intents.join(',')}`);
    if (stack.length > 0) context.push(`stack=${stack.join(',')}`);
    if (ir.constraints.length > 0) context.push(`constraints=${ir.constraints.join(',')}`);
    if (ir.priority !== 'medium') context.push(`priority=${ir.priority}`);
    if (context.length > 0) lines.push('', `CONTEXT: ${context.join('; ')}`);

    return lines.join('\n').trim();
  }
}
