# Prompt IR Schema

## Overview

The Intermediate Representation (IR) is the canonical, language-independent representation of a compiled prompt. All pipeline stages converge to produce an IR; all backend generators consume an IR.

## IR JSON Schema

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "PromptIR",
  "type": "object",
  "properties": {
    "version": {
      "type": "string",
      "description": "IR schema version",
      "example": "1.0"
    },
    "raw": {
      "type": "string",
      "description": "Original user input before any transformation"
    },
    "normalized": {
      "type": "string",
      "description": "Input after normalization, phrase resolution, filler removal"
    },
    "intents": {
      "type": "array",
      "items": {
        "type": "string",
        "enum": [
          "fix_bug", "debug", "explain", "generate_feature",
          "generate_game", "generate_api", "generate_ui", "refactor",
          "review_code", "security_audit", "performance_optimization",
          "architecture_design", "create_documentation", "write_tests",
          "optimize_prompt", "optimize_token", "analyze_project",
          "read_codebase", "search", "find_root_cause",
          "dependency_analysis", "migration", "deployment",
          "packaging", "release", "git_operations",
          "mcp_operations", "workspace_management",
          "multi_agent_coordination", "unknown"
        ]
      },
      "description": "Detected user intents (one or more)"
    },
    "constraints": {
      "type": "array",
      "items": {
        "type": "string",
        "enum": [
          "minimal_changes", "preserve_behavior", "backward_compatible",
          "no_breaking_changes", "keep_coding_style", "follow_architecture",
          "use_existing_utilities", "avoid_new_dependencies", "no_refactoring",
          "only_requested_files", "do_not_touch_tests", "offline_only",
          "token_efficient", "maintain_performance", "maintain_readability",
          "security_first", "cross_platform", "mobile_first",
          "accessibility_required", "no_hallucination"
        ]
      },
      "description": "Extracted constraints and requirements"
    },
    "target": {
      "type": "object",
      "properties": {
        "frameworks": { "type": "array", "items": { "type": "string" } },
        "languages": { "type": "array", "items": { "type": "string" } },
        "platforms": { "type": "array", "items": { "type": "string" } },
        "libraries": { "type": "array", "items": { "type": "string" } }
      },
      "description": "Technical target context"
    },
    "files": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "path": { "type": "string" },
          "action": { "type": "string", "enum": ["read", "edit", "create", "delete", "analyze"] }
        }
      },
      "description": "Referenced files and their intended actions"
    },
    "actions": {
      "type": "array",
      "items": { "type": "string" },
      "description": "Normalized action phrases"
    },
    "priority": {
      "type": "string",
      "enum": ["critical", "high", "medium", "low"],
      "description": "Computed priority based on constraints"
    },
    "safety": {
      "type": "object",
      "properties": {
        "preserveBehavior": { "type": "boolean" },
        "noBreakingChanges": { "type": "boolean" },
        "backwardCompatible": { "type": "boolean" },
        "noHallucination": { "type": "boolean" }
      },
      "description": "Safety-critical flags"
    },
    "outputStyle": {
      "type": "string",
      "enum": ["concise", "detailed", "standard"]
    },
    "optimizationLevel": {
      "type": "integer",
      "enum": [0, 1, 2]
    },
    "context": {
      "type": "object",
      "properties": {
        "projectType": { "type": "string" },
        "workspaceRoot": { "type": "string" },
        "branch": { "type": "string" },
        "language": { "type": "string" }
      }
    }
  },
  "required": ["version", "raw", "intents", "constraints", "target", "safety"]
}
```

## IR Example

```json
{
  "version": "1.0",
  "raw": "sửa bug trong component login với React TypeScript, đừng phá code cũ",
  "normalized": "fix bug in login component with React TypeScript preserve existing behavior",
  "intents": ["fix_bug"],
  "constraints": ["preserve_behavior", "minimal_changes"],
  "target": {
    "frameworks": ["React"],
    "languages": ["TypeScript"],
    "platforms": [],
    "libraries": []
  },
  "files": [
    { "path": "Login.tsx", "action": "analyze" }
  ],
  "actions": ["fix bug", "preserve existing behavior"],
  "priority": "critical",
  "safety": {
    "preserveBehavior": true,
    "noBreakingChanges": false,
    "backwardCompatible": false,
    "noHallucination": false
  },
  "outputStyle": "concise",
  "optimizationLevel": 2,
  "context": { "projectType": "web" }
}
```

## Intents Reference

| Intent | Description |
|--------|-------------|
| `fix_bug` | Bug fix / defect repair |
| `debug` | Debug / root cause analysis |
| `explain` | Explain code / concept |
| `generate_feature` | New feature implementation |
| `generate_game` | Game development |
| `generate_api` | API endpoint creation |
| `generate_ui` | UI component / page |
| `refactor` | Code restructuring |
| `review_code` | Code review |
| `security_audit` | Security review |
| `performance_optimization` | Performance tuning |
| `architecture_design` | System design |
| `create_documentation` | Documentation |
| `write_tests` | Test creation |
| `analyze_project` | Project analysis |
| `read_codebase` | Code reading |
| `search` | Code search |
| `find_root_cause` | Root cause investigation |
| `migration` | Code / data migration |
| `deployment` | Deploy / release |
| `git_operations` | Git operations |

## Constraints Reference

| Constraint | Description |
|------------|-------------|
| `minimal_changes` | Change as little as possible |
| `preserve_behavior` | Keep existing behavior |
| `backward_compatible` | Must be backward compatible |
| `no_breaking_changes` | No breaking changes |
| `keep_coding_style` | Follow existing code style |
| `follow_architecture` | Respect architecture |
| `use_existing_utilities` | Reuse existing code |
| `avoid_new_dependencies` | No new dependencies |
| `no_refactoring` | No refactoring |
| `only_requested_files` | Only touch specified files |
| `do_not_touch_tests` | Keep tests unchanged |
| `offline_only` | No internet / cloud |
| `token_efficient` | Minimize token usage |
| `security_first` | Security prioritized |
| `cross_platform` | Multi-platform support |
| `mobile_first` | Mobile-first design |
| `no_hallucination` | No invented content |
