# Flow Factory Agent Webhook 案例

這個目錄保存可與 Flow Factory `Agent Webhook` 模式相容的實作案例。

## 共用協議

Flow Factory 會傳送：

```json
{
  "prompt": "要執行的完整任務提示詞",
  "source": "flow-factory"
}
```

耗時任務應立即返回 HTTP `202`：

```json
{
  "ok": true,
  "status": "accepted",
  "task_id": "任務 ID",
  "result_url": "http://127.0.0.1:端口/tasks/任務 ID"
}
```

Flow Factory 會持續 GET `result_url`，直到狀態為 `completed` 或 `failed`。

連接測試使用：

```json
{
  "event_type": "connection_test",
  "prompt": "test",
  "source": "flow-factory"
}
```

## Hermes 案例

檔案：[hermes-flow-factory-webhook.py](hermes-flow-factory-webhook.py)

預設 URL：

```text
http://127.0.0.1:8646/webhooks/flow-factory
```

啟動：

```bash
python3 examples/webhooks/hermes-flow-factory-webhook.py
```

## Codex 案例

可執行腳本：[../../scripts/codex-flow-factory-webhook.py](../../scripts/codex-flow-factory-webhook.py)

預設 URL：

```text
http://127.0.0.1:8647/webhook
```

若端口已被占用，可改用其他端口：

```bash
CODEX_WEBHOOK_PORT=8648 \
CODEX_WEBHOOK_WORKDIR=/path/to/workspace \
python3 scripts/codex-flow-factory-webhook.py
```

本機目前因 `8647` 已被其他 Python 服務占用，實測使用：

```text
http://127.0.0.1:8648/webhook
```

Codex 案例使用以下安全預設：

- `workspace-write` sandbox
- `approval=never`，避免背景任務等待互動確認
- `--ephemeral`，不保存 CLI session
- 以 `--output-last-message` 取得乾淨的最終回答
- 每個任務保存獨立 JSON 狀態，避免多員工回覆混淆

## 安全注意

- 預設只監聽 `127.0.0.1`，不要直接暴露到公網。
- 不要把 API Token、Bearer Token、Codex 登入憑證提交到 Git。
- 如需遠端訪問，應增加身份驗證、TLS、請求大小限制與來源限制。
- Webhook 的工作目錄決定 Agent 可以讀寫的範圍，請使用明確且最小的目錄。
