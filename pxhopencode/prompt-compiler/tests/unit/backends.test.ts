import { describe, it, expect } from 'vitest';
import { Pipeline } from '../../src/pipeline/orchestrator.js';
import { generatePrompt, listBackends } from '../../src/backends/index.js';
import type { PromptIR } from '../../src/types.js';

const sampleIR: PromptIR = {
  version: '1.0',
  raw: 'Fix the login bug with TypeScript, preserve behavior',
  normalized: 'fix login bug with TypeScript preserve behavior',
  intents: ['fix_bug'],
  constraints: ['preserve_behavior', 'minimal_changes'],
  target: {
    frameworks: [],
    languages: ['TypeScript'],
    platforms: [],
    libraries: [],
  },
  files: [{ path: 'src/Login.tsx', action: 'read' }],
  actions: ['fix bug'],
  priority: 'critical',
  safety: {
    preserveBehavior: true,
    noBreakingChanges: false,
    backwardCompatible: false,
    noHallucination: false,
  },
  outputStyle: 'concise',
  optimizationLevel: 2,
  context: {},
};

describe('Backend Generators', () => {
  it('should list available backends', () => {
    const backends = listBackends();
    expect(backends).toContain('deepseek');
    expect(backends).toContain('claude');
    expect(backends).toContain('gpt');
    expect(backends).toContain('gemini');
    expect(backends).toContain('opencode');
    expect(backends).toContain('codex');
  });

  it('DeepSeek generator should produce output', () => {
    const prompt = generatePrompt(sampleIR, 'deepseek');
    expect(prompt.toLowerCase()).toContain('fix bug');
    expect(prompt).toContain('preserve existing behavior');
    expect(prompt.length).toBeGreaterThan(10);
  });

  it('Claude generator should produce structured output', () => {
    const prompt = generatePrompt(sampleIR, 'claude');
    expect(prompt).toContain('# Task');
    expect(prompt).toContain('fix bug');
  });

  it('GPT generator should produce structured output', () => {
    const prompt = generatePrompt(sampleIR, 'gpt');
    expect(prompt).toContain('# Role');
    expect(prompt).toContain('# Objective');
  });

  it('Gemini generator should produce output', () => {
    const prompt = generatePrompt(sampleIR, 'gemini');
    expect(prompt).toContain('fix bug');
    expect(prompt.length).toBeGreaterThan(20);
  });

  it('OpenCode generator should produce RULE+TARGET format', () => {
    const prompt = generatePrompt(sampleIR, 'opencode');
    expect(prompt).toContain('RULE:');
    expect(prompt).toContain('TARGET:');
    expect(prompt).toContain('CONTEXT:');
    expect(prompt).toContain('constraints=preserve_behavior,minimal_changes');
    const contextLine = prompt.split('\n').find(line => line.startsWith('CONTEXT:')) ?? '';
    expect(contextLine.match(/TypeScript/g)).toHaveLength(1);
  });

  it('Codex generator should produce commented output', () => {
    const prompt = generatePrompt(sampleIR, 'codex');
    expect(prompt).toContain('/*');
    expect(prompt).toContain('Task:');
  });

  it('should generate consistently with full pipeline', () => {
    const pipeline = new Pipeline();
    const result = pipeline.compile('Refactor the authentication module with TypeScript');
    const prompt = generatePrompt(result.ir, 'claude');
    expect(prompt.length).toBeGreaterThan(20);
    expect(prompt).toContain('refactor');
  });
});
