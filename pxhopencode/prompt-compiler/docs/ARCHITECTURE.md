# Prompt Compiler — Architecture

## Overview

The Prompt Compiler is a deterministic, zero-AI pipeline that transforms natural language into optimized LLM prompts via a canonical Intermediate Representation (IR).

```
User Prompt → [15 Stages] → IR → [Backend Generator] → Optimized Prompt
```

## Core Principles

1. **Zero AI**: No LLM, no ML, no neural networks, no cloud inference
2. **Deterministic**: Same input always produces same output
3. **Preserve Intent**: 100% of user intent must survive compilation
4. **Compression**: Reduce token count without losing semantics
5. **Multi-Backend**: Generate prompts optimized for different LLMs
6. **Multi-Language**: Support Vietnamese, English, CJK, mixed

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        INPUT (raw text)                         │
└─────────────────────────────────────────────────────────────────┘
                               │
                    ┌──────────▼──────────┐
                    │  Unicode Normalizer  │  NFC, emoji→text, whitespace
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │     Tokenizer        │  Word, CJK, path, code block
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │       Lexer          │  Intent/Framework/Lang tags
                    └──────────┬──────────┘
                               │
              ┌────────────────┼────────────────┐
              │                │                │
     ┌────────▼───┐   ┌───────▼───────┐   ┌────▼──────┐
     │IntentParser │   │ConstraintExtr │   │  Phrase   │
     │             │   │              │   │ Normalizer│
     └────────┬───┘   └───────┬───────┘   └────┬──────┘
              │                │                │
     ┌────────▼────────────────▼────────────────▼──────┐
     │           Semantic Analyzer                     │
     │    Developer slang → canonical phrases          │
     └────────────────────┬───────────────────────────┘
                          │
     ┌────────────────────▼───────────────────────────┐
     │           Technical Dictionary Resolver          │
     │    React→React, three.js→Three.js, TS→TS...     │
     └────────────────────┬───────────────────────────┘
                          │
     ┌────────────────────▼───────────────────────────┐
     │              Rule Engine                        │
     │    Remove fillers, greetings, repetitions      │
     └────────────────────┬───────────────────────────┘
                          │
     ┌────────────────────▼───────────────────────────┐
     │           Prompt Compressor                     │
     │    Token reduction, deduplication              │
     └────────────────────┬───────────────────────────┘
                          │
     ┌────────────────────▼───────────────────────────┐
     │         IR Builder                              │
     │    Produces canonical Intermediate Rep         │
     └────────────────────┬───────────────────────────┘
                          │
     ┌────────────────────▼───────────────────────────┐
     │         Backend Generator                       │
     │    DeepSeek / Claude / GPT / Gemini / OpenCode  │
     └────────────────────┬───────────────────────────┘
                          │
                    ┌─────▼─────┐
                    │  OUTPUT   │
                    └───────────┘
```

## Engine Components

### Trie (Prefix Tree)
- O(k) lookup for dictionary words
- Case-insensitive matching
- Longest-match-first resolution
- Used: technical terms, phrase normalization

### Aho-Corasick Automaton
- O(n + m) multi-pattern matching
- Built-in failure links for overlapping patterns
- Used: phrase matching, filler detection

### Finite State Machine (FSM)
- Intent recognition state machine
- Configurable transitions
- Accept/reject states

## Data Flow

```
Token → Lexeme → Semantic Match → IR Field
────────────────────────────────────────────
"React" → framework:React → target.frameworks[0]
"fix" → intent:fix_bug → intents[0]
"giữ nguyên" → constraint:preserve → constraints[0]
"đọc project" → action:analyze project → actions[0]
```

## Module Structure

```
prompt-compiler/
├── src/
│   ├── pipeline/          # 11 pipeline stages
│   ├── engine/            # Trie, Aho-Corasick, FSM
│   ├── dictionaries/      # Technical, phrases, intents, constraints, fillers
│   ├── backends/          # LLM-specific prompt generators
│   └── utils/             # Unicode, logging, benchmarking
├── tests/
│   ├── unit/              # Unit tests per module
│   ├── integration/       # Full pipeline tests
│   └── benchmarks/        # Performance benchmarks
└── docs/                  # Documentation
```

## Performance Targets

| Operation | Target |
|-----------|--------|
| Trie lookup (10K) | < 10ms |
| Aho-Corasick (100 patterns) | < 5ms |
| Full pipeline (medium prompt) | < 50ms |
| Full pipeline (large prompt) | < 200ms |
| Dictionary load + match | < 10ms |
| Compression ratio (verbose) | > 2x |
