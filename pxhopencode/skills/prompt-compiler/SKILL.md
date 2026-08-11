---
name: prompt-compiler
description: "Prompt Compiler — transforms natural language to optimized LLM prompts via canonical IR. Zero AI, zero cloud, zero token consumption. Use when: cần tối ưu prompt, compile prompt, phân tích intent, extract constraints."
---

# Prompt Compiler — Deterministic Prompt Engine

> Biến prompt tự nhiên thành IR canonical → sinh prompt tối ưu cho từng LLM backend.
> Chạy local, không token, không API, không AI.

## Cách dùng với pxh-pm

### Cách 1: Lệnh `/compile`

```
/compile [prompt của bạn]
```

→ Tự động chạy pipeline 14 stages → output IR + prompt optimized.

### Cách 2: Tích hợp auto-routing

pxh-pm tự động chạy Prompt Compiler **trước khi route** nếu:

```
1. Input là prompt tự nhiên (không phải /command hay @mention)
2. Compiler phát hiện intent rõ ràng (fix_bug, generate_game, ...)
3. IR có constraints (preserve_behavior, minimal_changes, ...)
```

Luồng: `User Prompt → Compiler → IR → pxh-pm analyze → Route T3`

### Cách 3: Gọi thủ công từ agent

```markdown
Load `skills/prompt-compiler/SKILL.md` → dùng Pipeline API:
- `prompt-compiler/src/pipeline/orchestrator.ts` → `new Pipeline().compile(prompt)`
- Output: `{ ir: PromptIR, prompt: string, metrics: CompilerMetrics }`
```

## Pipeline (14 stages)

| Stage | Module | Output |
|-------|--------|--------|
| Unicode Normalizer | `01-unicode-normalizer.ts` | NFC, emoji→text, whitespace |
| Tokenizer | `02-tokenizer.ts` | Tokens: word, CJK, path, code |
| Lexer | `03-lexer.ts` | Lexemes: framework, lang, intent |
| Intent Parser | `04-intent-parser.ts` | Intents: fix_bug, generate_game, enhance_ui, rapid_prototype, integrate_systems, refactor_vibe... |
| Constraint Extractor | `05-constraint-extractor.ts` | Constraints: preserve_behavior... |
| Semantic Analyzer | `06-semantic-analyzer.ts` | Developer slang→canonical (incl. vibe coding slang EN+VI) |
| Technical Resolver | `07-technical-resolver.ts` | React→React, three.js→Three.js |
| Phrase Normalizer | `08-phrase-normalizer.ts` | đọc project→analyze project, vibe phrases→normalized actions |
| Rule Engine | `09-rule-engine.ts` | Remove fillers, greetings |
| Compressor | `10-prompt-compressor.ts` | Token reduction |
| IR Builder | `11-ir-builder.ts` | Canonical Intermediate Representation |
| Backend Generator | backends/*.ts | DeepSeek/Claude/GPT/Gemini/OpenCode |

## Backends hỗ trợ (6)

| Backend | File | Output style |
|---------|------|-------------|
| `deepseek` | `backends/deepseek.ts` | Concise + constraints |
| `claude` | `backends/claude.ts` | Structured sections |
| `gpt` | `backends/gpt.ts` | Role + Objective + Constraints |
| `gemini` | `backends/gemini.ts` | Flat + direct |
| `opencode` | `backends/opencode.ts` | RULE+TARGET format |
| `codex` | `backends/codex.ts` | Commented code |

## IR Schema (PromptIR)

```typescript
interface PromptIR {
  version: string;
  raw: string;                           // Input gốc
  normalized: string;                    // Sau normalization
  intents: Intent[];                     // fix_bug, generate_game...
  constraints: Constraint[];             // preserve_behavior, minimal_changes...
  target: { frameworks, languages, platforms, libraries };
  files: { path, action }[];             // File refs
  actions: string[];                     // Normalized action phrases
  priority: 'critical' | 'high' | 'medium' | 'low';
  safety: { preserveBehavior, noBreakingChanges, ... };
  outputStyle: 'concise' | 'detailed' | 'standard';
  optimizationLevel: 0 | 1 | 2;
  context: { projectType?, workspaceRoot?, branch? };
}
```

## Ví dụ

### Input: "sửa bug trong component login với React TypeScript, đừng phá code cũ"

→ IR output:
```json
{
  "intents": ["fix_bug"],
  "constraints": ["preserve_behavior", "minimal_changes"],
  "target": { "frameworks": ["React"], "languages": ["TypeScript"] },
  "priority": "critical",
  "safety": { "preserveBehavior": true, "noBreakingChanges": false }
}
```

### Input: "Làm game platformer 2D với Phaser 3"

→ IR output:
```json
{
  "intents": ["generate_game"],
  "target": { "frameworks": ["Phaser"] },
  "context": { "projectType": "game" }
}
```

## Vibe Coding Vocabulary

Từ điển ánh xạ vibe coding slang → canonical intent/constraint/action.
Dùng ở stage **Semantic Analyzer** (slang→canonical) và **Phrase Normalizer** (phrase→action).

### English Vibe Slang → Canonical

| Slang | Canonical | Stage |
|-------|-----------|-------|
| `vibe coding`, `vibe code` | `ai_assisted_development` | Semantic Analyzer |
| `make it pop`, `give it some sauce` | `enhance_visual_appeal` | Semantic Analyzer |
| `it's giving {style}` | `apply_aesthetic:{style}` | Semantic Analyzer |
| `the vibes are off` | `fix_aesthetic_ux_issues` | Semantic Analyzer |
| `ship it`, `just ship it` | `prepare_for_deployment` | Semantic Analyzer |
| `jank`, `janky`, `janky code` | `unpolished_implementation` | Semantic Analyzer |
| `spicy`, `spicy code` | `complex_implementation` | Semantic Analyzer |
| `glue it together`, `glue code` | `integrate_components` | Semantic Analyzer |
| `slap on`, `slap together` | `add_quickly` | Semantic Analyzer |
| `wire it up` | `connect_integrate` | Semantic Analyzer |
| `piece of cake`, `easy peasy` | `trivial_task` | Semantic Analyzer |
| `clean it up`, `clean up` | `refactor_for_clarity` | Semantic Analyzer |
| `make it work`, `just make it work` | `ensure_functionality` | Semantic Analyzer |
| `frankenstein`, `frankenstein code` | `integrate_disparate_components` | Semantic Analyzer |

### English Vibe Phrase → Action

| Phrase | Normalized Action | Stage |
|--------|------------------|-------|
| `make it look cool` | `improve_ui_ux_design` | Phrase Normalizer |
| `just get it done` | `implement_with_minimal_ceremony` | Phrase Normalizer |
| `throw something together` | `rapid_prototype` | Phrase Normalizer |
| `cobble together` | `implement_with_available_resources` | Phrase Normalizer |
| `bootstrap` | `initial_setup` | Phrase Normalizer |
| `pave the cow path` | `refactor_existing_pattern` | Phrase Normalizer |

### Vietnamese Vibe Slang → Canonical

Developer slang phổ biến trong vibe coding cộng đồng Việt:

| Slang | Canonical | Stage |
|-------|-----------|-------|
| `chạy tạm`, `cho nó chạy đã` | `ensure_functionality` | Semantic Analyzer |
| `đập đi xây lại` | `rewrite_from_scratch` | Semantic Analyzer |
| `chắp vá` | `integrate_disparate_components` | Semantic Analyzer |
| `làm cho đẹp`, `làm cho nó pro` | `enhance_visual_appeal` | Semantic Analyzer |
| `nối dây`, `đấu nối` | `connect_integrate` | Semantic Analyzer |
| `fix đê`, `sửa đê` | `fix_bug` | Semantic Analyzer |
| `lên production`, `đẩy lên` | `prepare_for_deployment` | Semantic Analyzer |
| `làm nhanh`, `làm tạm` | `rapid_prototype` | Semantic Analyzer |
| `cóp py`, `copy paste` | `reuse_existing_code` | Semantic Analyzer |
| `ngon`, `ngon lành` | `working_correctly` | Semantic Analyzer |
| `cứt`, ` code cứt` | `poor_quality_code` | Semantic Analyzer |
| `xịn`, `xịn xò` | `high_quality_implementation` | Semantic Analyzer |
| `cấu hình` | `initial_setup` | Phrase Normalizer |

### Intent mới từ vibe coding

| Intent | Trigger phrases | Priority |
|--------|----------------|----------|
| `enhance_ui` | make it pop, give it some sauce, làm cho đẹp, làm cho nó pro | medium |
| `rapid_prototype` | throw together, cobble together, làm nhanh, làm tạm | high |
| `integrate_systems` | glue together, wire up, frankenstein, nối dây, đấu nối, chắp vá | high |
| `refactor_vibe` | clean it up, pave the cow path | medium |

## Anti-Rationalization

| Excuse | Reality |
|--------|---------|
| "Compiler chạy sau cũng được, prompt ổn rồi" | Không compile = token waste, intent ambiguous |
| "IR chỉ là format, không ảnh hưởng output" | IR sai → backend gen sai → quality giảm |
| "Tôi biết intent của mình mà" | Biết intent ≠ extract constraints đúng |
| "Compress làm mất context" | Compressor giữ semantics, chỉ bỏ filler |

## Red Flags

- Skip compiler stage vì "prompt ngắn"
- Backend generator không match IR output style
- IR có confidence score < 60 nhưng vẫn dùng
- Constraints missing → LLM tự do interpret
- Compression ratio < 1.2x (còn nhiều filler)

## Verification
- [ ] Pipeline chạy < 50ms cho medium prompt
- [ ] Intent detected correctly for target language
- [ ] Vibe coding slang mapped to canonical (EN + VI)
- [ ] New vibe intents parsed (enhance_ui, rapid_prototype, integrate_systems, refactor_vibe)
- [ ] Constraints extracted from implicit phrases (đừng phá code → preserve_behavior)
- [ ] Technical terms normalized (three.js, react native, typescript)
- [ ] Fillers removed (hãy, giúp tôi, please)
- [ ] Prompt có compression ratio > 1.5x cho verbose input
