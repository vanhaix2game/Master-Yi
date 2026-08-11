import type { PromptIR, Intent, Constraint, Lexeme, FileRef } from '../types.js';

export function buildIR(params: {
  raw: string;
  normalized: string;
  intents: Intent[];
  constraints: Constraint[];
  lexemes: Lexeme[];
  actions: string[];
}): PromptIR {
  const frameworks = extractFrameworks(params.normalized, params.lexemes);
  const languages = extractLanguages(params.normalized, params.lexemes);
  const platforms = extractPlatforms(params.normalized, params.lexemes);
  const libraries = extractLibraries(params.normalized, params.lexemes);
  const files = extractFiles(params.normalized, params.lexemes);

  const hasCritical = params.constraints.some(c =>
    ['preserve_behavior', 'no_breaking_changes', 'security_first', 'no_hallucination'].includes(c)
  );

  const hasHighPriorityIntent = params.intents.some(i =>
    ['rapid_prototype', 'integrate_systems'].includes(i)
  );

  return {
    version: '1.0',
    raw: params.raw,
    normalized: params.normalized,
    intents: params.intents,
    constraints: params.constraints,
    target: { frameworks, languages, platforms, libraries },
    files,
    actions: params.actions,
    priority: hasCritical ? 'critical' : hasHighPriorityIntent ? 'high' : params.constraints.length > 3 ? 'high' : 'medium',
    safety: {
      preserveBehavior: params.constraints.includes('preserve_behavior'),
      noBreakingChanges: params.constraints.includes('no_breaking_changes'),
      backwardCompatible: params.constraints.includes('backward_compatible'),
      noHallucination: params.constraints.includes('no_hallucination'),
    },
    outputStyle: params.intents.includes('explain') || params.intents.includes('refactor_vibe') || params.intents.includes('enhance_ui') ? 'detailed' : 'concise',
    optimizationLevel: 2,
    context: {
      projectType: detectProjectType({ frameworks, languages, platforms, libraries }),
    },
  };
}

const FRAMEWORKS = new Set(['react','vue','angular','svelte','next.js','nuxt','express',
  'fastify','nestjs','django','flask','spring','fastapi','electron','tailwind',
  'bootstrap','phaser','three.js','unity','godot','react native','tauri','nextjs']);

const LANGUAGES = new Set(['typescript','javascript','python','rust','golang','go',
  'java','kotlin','swift','c#','c++','ruby','php','scala','r','csharp','cpp']);

const PLATFORMS = new Set(['node.js','nodejs','deno','bun','docker','vercel',
  'netlify','aws','gcp','azure','android','ios','linux','windows','macos']);

const LIBRARIES = new Set(['prisma','typeorm','drizzle','sequelize','graphql','redux',
  'zustand','jotai','axios','vitest','jest','playwright','cypress','langchain',
  'tensorflow','pytorch','trpc','tanstack query','react query','socket.io',
  'matter.js','cannon-es']);

function extractFromText(text: string, dictionary: Set<string>): string[] {
  const found: string[] = [];
  for (const term of dictionary) {
    const parts = term.split(/\s+/);
    let pattern = parts.map(p => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('\\s+');
    if (parts.length === 1) pattern = '\\b' + pattern + '\\b';
    const regex = new RegExp(pattern, 'i');
    if (regex.test(text)) found.push(capitalize(term));
  }
  return found;
}

function capitalize(term: string): string {
  return term.split(/\s+/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

function extractFrameworks(normalized: string, lexemes: Lexeme[]): string[] {
  const fromLex = lexemes.filter(l => l.category === 'framework' && l.confidence >= 0.7).map(l => l.token.value);
  const fromText = extractFromText(normalized, FRAMEWORKS);
  return [...new Set([...fromLex, ...fromText])];
}

function extractLanguages(normalized: string, lexemes: Lexeme[]): string[] {
  const fromLex = lexemes.filter(l => l.category === 'language' && l.confidence >= 0.7).map(l => l.token.value);
  const fromText = extractFromText(normalized, LANGUAGES);
  return [...new Set([...fromLex, ...fromText])];
}

function extractPlatforms(normalized: string, lexemes: Lexeme[]): string[] {
  const fromLex = lexemes.filter(l => l.category === 'platform' && l.confidence >= 0.7).map(l => l.token.value);
  const fromText = extractFromText(normalized, PLATFORMS);
  return [...new Set([...fromLex, ...fromText])];
}

function extractLibraries(normalized: string, lexemes: Lexeme[]): string[] {
  const fromLex = lexemes.filter(l => l.category === 'library' && l.confidence >= 0.7).map(l => l.token.value);
  const fromText = extractFromText(normalized, LIBRARIES);
  return [...new Set([...fromLex, ...fromText])];
}

const FILE_REGEX = /[a-zA-Z0-9_\-./\\]+\.[a-zA-Z0-9]{1,6}/g;

function extractFiles(input: string, lexemes: Lexeme[]): FileRef[] {
  const fileSet = new Set<string>();

  for (const lex of lexemes) {
    if (lex.category === 'file_path' && lex.token.value.length > 2) {
      fileSet.add(lex.token.value);
    }
  }

  const regexMatches = input.match(FILE_REGEX) || [];
  for (const m of regexMatches) {
    if (/\.(ts|tsx|js|jsx|py|rs|go|java|kt|swift|cs|cpp|c|rb|php|vue|svelte|json|md|css|scss|html|sql|toml|yaml|yml|env|prisma)$/i.test(m)) {
      fileSet.add(m);
    }
  }

  return [...fileSet].map(path => ({ path, action: 'analyze' as const }));
}

function detectProjectType(target: {
  frameworks: string[];
  languages: string[];
  platforms: string[];
  libraries: string[];
}): string | undefined {
  if (target.frameworks.some(f => /phaser|three\.js|unity|godot/i.test(f))) return 'game';
  if (target.frameworks.some(f => /react|vue|angular|svelte|next/i.test(f))) return 'web';
  if (target.libraries.some(l => /langchain|tensorflow|pytorch/i.test(l))) return 'ai';
  if (target.platforms.some(p => /android|ios/i.test(p))) return 'mobile';
  if (target.frameworks.some(f => /electron|tauri/i.test(f))) return 'desktop';
  if (target.frameworks.some(f => /express|fastify|django|fastapi|spring/i.test(f))) return 'api';
  return undefined;
}
