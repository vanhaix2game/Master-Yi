import type { Backend, BackendGenerator, PromptIR } from '../types.js';
import { DeepSeekGenerator } from './deepseek.js';
import { ClaudeGenerator } from './claude.js';
import { GPTGenerator } from './gpt.js';
import { GeminiGenerator } from './gemini.js';
import { OpenCodeGenerator } from './opencode.js';
import { CodexGenerator } from './codex.js';

const registry = new Map<Backend, () => BackendGenerator>();

function register(name: Backend, factory: () => BackendGenerator): void {
  registry.set(name, factory);
}

register('deepseek', () => new DeepSeekGenerator());
register('claude', () => new ClaudeGenerator());
register('gpt', () => new GPTGenerator());
register('gemini', () => new GeminiGenerator());
register('opencode', () => new OpenCodeGenerator());
register('codex', () => new CodexGenerator());

export function getGenerator(backend: Backend): BackendGenerator {
  const factory = registry.get(backend);
  if (!factory) throw new Error(`Unknown backend: ${backend}`);
  return factory();
}

export function generatePrompt(ir: PromptIR, backend: Backend): string {
  return getGenerator(backend).generate(ir);
}

export function registerBackend(name: Backend, factory: () => BackendGenerator): void {
  registry.set(name, factory);
}

export function listBackends(): Backend[] {
  return [...registry.keys()];
}
