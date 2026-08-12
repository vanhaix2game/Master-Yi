---
name: tools-cli
description: CLI app production — commander, clap, click. Spinner, progress bar, error handling, auto-completion, cross-platform.
---

# tools-cli — CLI Apps

## Node.js CLI (commander + inquirer + ora)
See `templates/node-cli.ts`.

Deps: `npm install commander @inquirer/prompts chalk ora`

## Rust CLI (clap + indicatif)
See `templates/rust-cli.rs`.

Deps: clap (features = ["derive"]), indicatif, anyhow in Cargo.toml

## Python CLI (click + rich)
See `templates/python-cli.py`.

Deps: `pip install click rich`

## Error handling
See `templates/error-handling.ts`.

Wrap main entry point; throw `CLIError` for known failures, let unexpected errors bubble to the catch-all.

## Anti-Rationalization
| Excuse | Reality |
|--------|---------|
| "Spinner không cần, CLI nhanh mà" | Task 3s+ → user tưởng treo, Ctrl+C |
| "Error thô đủ rõ" | Stack trace làm user hoảng, không biết fix |
| "Auto-completion lãng phí" | User gõ sai option liên tục → bad UX |

## Red Flags
- CLI không có progress indicator cho task dài
- Error output show stack trace (no --verbose)
- Không auto-completion

## Verification
- [ ] Spinner/progress bar cho task > 2s
- [ ] CLIError message + suggestion, stacktrace chỉ --verbose
- [ ] NO_COLOR fallback hoạt động
