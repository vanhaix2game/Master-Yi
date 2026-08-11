import { BaseGenerator } from './base.js';
import type { PromptIR } from '../types.js';

export class CodexGenerator extends BaseGenerator {
  name = 'codex' as const;

  generate(ir: PromptIR): string {
    const lines: string[] = [];

    lines.push('/*');
    lines.push(` * Task: ${this.formatIntents(ir)}`);
    lines.push(' */');

    const context = this.buildContext(ir);
    for (const c of context) lines.push(`// ${c}`);

    if (ir.constraints.length > 0) {
      lines.push('/*');
      lines.push(' * Requirements:');
      for (const c of ir.constraints) lines.push(` * - ${c.replace(/_/g, ' ')}`);
      lines.push(' */');
    }

    if (ir.files.length > 0) {
      lines.push('// Files:');
      for (const f of ir.files) lines.push(`// ${f.path} (${f.action})`);
    }

    return lines.join('\n').trim();
  }
}
