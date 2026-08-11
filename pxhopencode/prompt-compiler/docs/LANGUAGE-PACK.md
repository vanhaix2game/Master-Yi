# Language Pack Guide

## Overview

Language packs extend the compiler's phrase matching and intent recognition for new languages. Each pack provides:

- Phrase mappings (local → canonical English)
- Filler word patterns
- Intent patterns (regex)
- Constraint patterns (regex)

## Pack Format

```typescript
interface LanguagePack {
  name: string;
  version: string;
  locale: string;
  phrases: Array<[string, string, number]>;     // [local, canonical, confidence]
  fillers: Array<[string, string, number]>;      // [local, '', confidence]
  intents: Array<{ patterns: RegExp[]; intent: string; priority: number }>;
  constraints: Array<{ patterns: RegExp[]; constraint: string; priority: number }>;
}
```

## Built-in Support

| Language | Status | Notes |
|----------|--------|-------|
| Vietnamese | ✅ Full | ~80 phrase mappings, ~20 filler patterns |
| English | ✅ Full | Native patterns |
| Japanese | ✅ Basic | CJK tokenization |
| Chinese | ✅ Basic | CJK tokenization |
| Korean | ✅ Basic | CJK tokenization |
| Thai | ✅ Basic | Unicode normalization |
| Mixed EN+VI | ✅ Full | Detected automatically |

## Creating a Language Pack

1. Create `src/dictionaries/lang-XX.ts`
2. Add phrase mappings and patterns
3. Register in the DictionaryManager

```typescript
// src/dictionaries/lang-fr.ts
export const frenchPhrases: Array<[string, string, number]> = [
  ['corriger le bug', 'fix bug', 1.0],
  ['analyser le projet', 'analyze project', 1.0],
  ['revue de code', 'review code', 1.0],
  ['conserver le comportement', 'preserve existing behavior', 1.0],
];

export const frenchFillers: Array<[string, string, number]> = [
  ['sil vous plaît', '', 1.0],
  ['merci', '', 0.8],
  ['je voudrais', '', 0.7],
];
```

## Auto-Detection

Language is auto-detected based on:

- CJK character density (Chinese, Japanese, Korean)
- Vietnamese diacritic frequency (à, á, ả, ã, ạ, etc.)
- Latin vs CJK ratio

```typescript
import { detectLanguage } from './utils/unicode.js';

detectLanguage('Xin chào');         // 'vietnamese'
detectLanguage('Hello world');       // 'english'
detectLanguage('こんにちは');         // 'mixed-asian'
detectLanguage('안녕하세요');         // 'mixed-asian'
```
