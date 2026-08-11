import type { CompilerOptions, CompilerResult, CompilerMetrics, StageMetric } from '../types.js';
import { unicodeNormalize } from './01-unicode-normalizer.js';
import { tokenize } from './02-tokenizer.js';
import { lex } from './03-lexer.js';
import { parseIntent } from './04-intent-parser.js';
import { extractConstraints } from './05-constraint-extractor.js';
import { analyzeSemantics, normalizeDevPhrases } from './06-semantic-analyzer.js';
import { resolveTechnicalTerms } from './07-technical-resolver.js';
import { normalizePhrases } from './08-phrase-normalizer.js';
import { applyRules, applyCleanupRules } from './09-rule-engine.js';
import { compressPrompt } from './10-prompt-compressor.js';
import { buildIR } from './11-ir-builder.js';
import { generatePrompt } from '../backends/index.js';

const DEFAULT_OPTIONS: CompilerOptions = {
  backend: 'deepseek',
  optimizationLevel: 2,
  outputStyle: 'concise',
};

export class Pipeline {
  private options: CompilerOptions;
  private metrics: StageMetric[] = [];

  constructor(options?: Partial<CompilerOptions>) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  compile(input: string): CompilerResult {
    const t0 = performance.now();
    this.metrics = [];

    if (!input || input.trim().length === 0) {
      throw new Error('PromptCompiler: empty input');
    }

    const stage1 = unicodeNormalize(input);
    this.metrics.push(stage1.metric);
    let current = stage1.output;

    const stage2 = tokenize(current);
    this.metrics.push(stage2.metric);

    const stage3 = lex(stage2.tokens);
    this.metrics.push(stage3.metric);

    const stage4 = parseIntent(current, stage3.lexemes);
    this.metrics.push(stage4.metric);

    const stage5 = extractConstraints(current);
    this.metrics.push(stage5.metric);

    const stage6 = analyzeSemantics(current, stage3.lexemes, stage5.constraints);
    this.metrics.push(stage6.metric);

    const { output: devNormalized, replacements } = normalizeDevPhrases(current);
    if (replacements > 0) current = devNormalized;

    const stage7 = resolveTechnicalTerms(current, stage3.lexemes);
    this.metrics.push(stage7.metric);
    current = stage7.output;

    const stage8 = normalizePhrases(current);
    this.metrics.push(stage8.metric);
    current = stage8.output;

    const stage9 = applyRules(current);
    this.metrics.push(stage9.metric);
    current = stage9.output;

    const { output: cleaned } = applyCleanupRules(current);
    current = cleaned;

    const ir = buildIR({
      raw: input,
      normalized: current,
      intents: stage4.intents,
      constraints: stage5.constraints,
      lexemes: stage3.lexemes,
      actions: stage6.actions,
    });

    const stage10 = compressPrompt(ir);
    this.metrics.push(stage10.metric);

    const prompt = generatePrompt(ir, this.options.backend);

    const finalMetrics: CompilerMetrics = {
      inputTokens: countTokens(input),
      outputTokens: countTokens(prompt),
      compressionRatio: prompt.length > 0 ? +(input.length / prompt.length).toFixed(2) : 1,
      stages: this.metrics,
      totalMs: +(performance.now() - t0).toFixed(2),
    };

    return { ir, prompt, metrics: finalMetrics };
  }

  setOptions(options: Partial<CompilerOptions>): void {
    this.options = { ...this.options, ...options };
  }

  getMetrics(): StageMetric[] {
    return [...this.metrics];
  }
}

function countTokens(text: string): number {
  return Math.ceil(text.length / 3.9);
}
