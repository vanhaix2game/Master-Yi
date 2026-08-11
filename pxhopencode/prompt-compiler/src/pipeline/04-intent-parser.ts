import type { Intent, Lexeme, StageMetric } from '../types.js';
import { DictionaryManager } from '../dictionaries/index.js';

const dict = new DictionaryManager();

export function parseIntent(input: string, lexemes: Lexeme[]): { intents: Intent[]; metric: StageMetric } {
  const t0 = performance.now();
  const intents: Set<Intent> = new Set();

  const patterns = dict.getIntentPatterns();

  for (const pattern of patterns) {
    for (const regex of pattern.patterns) {
      if (regex.test(input)) {
        intents.add(pattern.intent);
        break;
      }
    }
    if (intents.has(pattern.intent)) continue;
  }

  if (intents.size === 0) {
    for (const lex of lexemes) {
      if (lex.category === 'intent' && lex.confidence >= 0.8) {
        const mapped = mapLexemeToIntent(lex.token.value);
        if (mapped) intents.add(mapped);
      }
    }
  }

  if (intents.size === 0) {
    intents.add('unknown');
  }

  const ms = performance.now() - t0;
  return {
    intents: [...intents],
    metric: { name: 'IntentParser', ms, inputLength: input.length, outputLength: intents.size },
  };
}

function mapLexemeToIntent(word: string): Intent | null {
  const map: Record<string, Intent> = {
    fix: 'fix_bug', debug: 'debug', create: 'generate_feature',
    generate: 'generate_feature', add: 'generate_feature',
    implement: 'generate_feature', build: 'generate_feature',
    write: 'generate_feature', refactor: 'refactor',
    review: 'review_code', audit: 'security_audit',
    optimize: 'performance_optimization', design: 'architecture_design',
    document: 'create_documentation', test: 'write_tests',
    analyze: 'analyze_project', read: 'read_codebase',
    search: 'search', find: 'find_root_cause',
    migrate: 'migration', deploy: 'deployment',
    release: 'release',
    enhance: 'enhance_ui', prototype: 'rapid_prototype',
    integrate: 'integrate_systems', glue: 'integrate_systems',
    polish: 'refactor_vibe', cleanup: 'refactor_vibe',
  };
  return map[word.toLowerCase()] || null;
}
