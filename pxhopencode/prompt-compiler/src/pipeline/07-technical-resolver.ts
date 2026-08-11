import type { StageMetric } from '../types.js';
import { DictionaryManager } from '../dictionaries/index.js';

const dict = new DictionaryManager();

export function resolveTechnicalTerms(
  input: string,
  _lexemes: unknown[]
): { output: string; resolved: Array<{ original: string; normalized: string }>; metric: StageMetric } {
  const t0 = performance.now();
  const matches = dict.getTechnicalTrie().findAllMatches(input);
  const resolved: Array<{ original: string; normalized: string }> = [];
  let output = input;

  const sorted = matches.sort((a, b) => b.end - b.start - (a.end - a.start));

  for (const match of sorted) {
    const original = input.slice(match.start, match.end);
    if (needsWordBoundary(original) && (isWordChar(input[match.start - 1]) || isWordChar(input[match.end]))) continue;
    if (original !== match.output) {
      const before = output;
      output = output.slice(0, match.start) + match.output + output.slice(match.end);
      if (output !== before) {
        resolved.push({ original, normalized: match.output });
      }
    }
  }

  const ms = performance.now() - t0;
  return {
    output,
    resolved,
    metric: { name: 'TechnicalResolver', ms, inputLength: input.length, outputLength: output.length },
  };
}

function isWordChar(char: string | undefined): boolean {
  return !!char && /[\p{L}\p{N}_]/u.test(char);
}

function needsWordBoundary(term: string): boolean {
  return /^[\p{L}\p{N}_]+$/u.test(term);
}

const FILE_EXT_MAP: Record<string, string> = {
  '.ts': 'TypeScript', '.tsx': 'TypeScript React', '.js': 'JavaScript',
  '.jsx': 'JavaScript React', '.py': 'Python', '.rs': 'Rust',
  '.go': 'Go', '.java': 'Java', '.kt': 'Kotlin', '.swift': 'Swift',
  '.cs': 'C#', '.cpp': 'C++', '.c': 'C', '.rb': 'Ruby',
  '.php': 'PHP', '.vue': 'Vue', '.svelte': 'Svelte',
  '.json': 'JSON', '.yaml': 'YAML', '.yml': 'YAML',
  '.toml': 'TOML', '.md': 'Markdown', '.css': 'CSS',
  '.scss': 'SCSS', '.less': 'Less', '.html': 'HTML',
  '.sql': 'SQL', '.prisma': 'Prisma', '.env': 'Environment',
};

export function resolveFileExtension(ext: string): string | null {
  return FILE_EXT_MAP[ext.toLowerCase()] || null;
}
