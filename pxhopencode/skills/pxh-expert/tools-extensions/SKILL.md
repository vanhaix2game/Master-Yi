---
name: tools-extensions
description: VS Code extension — commands, views, providers, config. Không block UI, đúng lifecycle, production-ready.
---

# tools-extensions — IDE Extensions

## VS Code Extension (cơ bản)
See `templates/extension.ts`.

Register commands in `activate()`, push disposables to `context.subscriptions`. Cleanup in `deactivate()`.

## Tree View Provider
See `templates/tree-view.ts`.

Extend `TreeItem` for custom data. Implement `TreeDataProvider` with `getChildren` / `getTreeItem`. Call `refresh()` to update.

## Webview Panel
See `templates/webview.ts`.

Single-instance webview panel with `reveal()` on re-show. Use `getHtml()` for inline HTML. Enable `enableScripts` for JS interaction.

## Anti-Rationalization
| Excuse | Reality |
|--------|---------|
| "Disposable không push context.subscriptions" | Extension leak = VS Code chậm dần |
| "Webview panel mỗi lần tạo mới" | User mở lại → panel cũ treo memory |
| "Tree view data provider không refresh" | User thấy dữ liệu cũ, tưởng bug |

## Red Flags
- activate() không push disposables
- Webview không reveal() khi đã tồn tại
- TreeDataProvider không gọi refresh()

## Verification
- [ ] Mọi command/listener push vào context.subscriptions
- [ ] Webview check instance tồn tại trước khi tạo mới
- [ ] Tree view refresh() sau data change
