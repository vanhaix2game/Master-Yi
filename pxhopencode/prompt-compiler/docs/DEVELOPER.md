# Developer Guide

## Getting Started

```bash
cd prompt-compiler
npm install
npm run build
npm test
```

## Usage

### Basic Compilation

```typescript
import { Pipeline } from '@pxh/prompt-compiler';

const pipeline = new Pipeline({ backend: 'deepseek' });
const result = pipeline.compile('Fix the login bug with TypeScript');

console.log(result.ir.intents);       // ['fix_bug']
console.log(result.ir.constraints);   // []
console.log(result.prompt);            // Optimized prompt for DeepSeek
console.log(result.metrics);           // Compiler metrics
```

### Multi-Backend

```typescript
import { Pipeline, generatePrompt } from '@pxh/prompt-compiler';

const pipeline = new Pipeline();
const result = pipeline.compile('Build a React component with TypeScript');

const forClaude = generatePrompt(result.ir, 'claude');
const forGPT = generatePrompt(result.ir, 'gpt');
const forOpenCode = generatePrompt(result.ir, 'opencode');
```

### Options

```typescript
const pipeline = new Pipeline({
  backend: 'claude',           // Target LLM
  optimizationLevel: 2,        // 0=none, 1=standard, 2=aggressive
  outputStyle: 'concise',      // concise | detailed | standard
});
```

## Adding a Backend

1. Create `src/backends/my-llm.ts`
2. Extend `BaseGenerator`
3. Implement `generate(ir: PromptIR): string`
4. Register in `src/backends/index.ts`

```typescript
import { BaseGenerator } from './base.js';
import type { PromptIR } from '../types.js';

export class MyLLMGenerator extends BaseGenerator {
  name = 'my-llm' as const;
  
  generate(ir: PromptIR): string {
    // Build prompt optimized for MyLLM
    return `[MyLLM] ${this.formatIntents(ir)} ...`;
  }
}
```

## Adding Dictionary Entries

### Technical Terms

Edit `src/dictionaries/technical.ts`:

```typescript
['my-framework', 'MyFramework', 1.0],
```

### Phrases

Edit `src/dictionaries/phrases.ts`:

```typescript
['đọc project', 'analyze project', 1.0],
```

### Intents

Edit `src/dictionaries/intents.ts`:

```typescript
{
  intent: 'my_intent',
  patterns: [ /regex to match/i ],
  priority: 5,
},
```

## Testing

```bash
npm test              # All tests
npm run test:coverage  # Coverage report
npm run bench          # Performance benchmarks
```

## Performance Optimization

The compiler is designed for <50ms execution on medium prompts:

- Use `Trie` for prefix-based lookups
- Use `AhoCorasick` for multi-pattern matching
- Avoid regex-heavy operations in hot paths
- Pre-compile dictionaries at startup
- Use `performance.now()` for profiling

## Plugin System

```typescript
import { Pipeline } from '@pxh/prompt-compiler';
import type { Plugin } from '@pxh/prompt-compiler';

const myPlugin: Plugin = {
  name: 'my-plugin',
  version: '1.0',
  hooks: {
    afterNormalize: (input) => input.replace(/foo/g, 'bar'),
    afterBuildIR: (ir) => ({ ...ir, priority: 'high' }),
  },
};

// Plugins hook into pipeline stages
```
