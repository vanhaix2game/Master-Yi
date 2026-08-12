---
name: tools-packaging
description: Build & distribute — npm, Cargo, PyPI, Docker, Homebrew. Cross-platform, CI/CD, auto-update.
---

# tools-packaging — Build & Distribute

## npm Package
See `templates/npm/package.json`.

```bash
npm publish              # public package
npm publish --tag beta   # beta channel
npm deprecate @scope/my-tool@"<1.0" "Please upgrade to v1"
```

## Rust Cargo
See `templates/cargo/Cargo.toml`.

```bash
cargo publish
cargo install my-tool     # User install
```

## Python PyPI
See `templates/pypi/pyproject.toml`.

```bash
python -m build
twine upload dist/*
pip install my-tool
```

## Docker
See `templates/docker/Dockerfile`.

```bash
docker build -t my-tool .
docker run my-tool --help
```

## GitHub Actions CI
See `templates/.github/release.yml`.

Triggers on tag push `v*`. Runs tests + publishes to npm. Adjust `setup-node` registry for other registries.

## Anti-Rationalization
| Excuse | Reality |
|--------|---------|
| "publish manual cũng được" | Quên build, quên bump version → publish hỏng |
| "Docker image không cần tag" | latest = ai biết version nào đang chạy |
| "Pre-release channel không cần" | Breaking change đến thẳng user = support tăng |

## Red Flags
- Publish manual không qua CI/CD
- Docker image không version tag
- Changelog không update

## Verification
- [ ] CI/CD publish: tag push → test → build → publish
- [ ] Docker image tagged with version
- [ ] npm/cargo/pip publish command tested
