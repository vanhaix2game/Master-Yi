class MyWebview {
  private panel: vscode.WebviewPanel | undefined;

  show(context: vscode.ExtensionContext) {
    if (this.panel) {
      this.panel.reveal();
      return;
    }

    this.panel = vscode.window.createWebviewPanel(
      "myTool",
      "My Tool",
      vscode.ViewColumn.One,
      { enableScripts: true }
    );

    this.panel.webview.html = this.getHtml();
    this.panel.onDidDispose(() => { this.panel = undefined; });
  }

  private getHtml(): string {
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { padding: 16px; font-family: var(--vscode-font-family); }
    button { background: var(--vscode-button-background); color: var(--vscode-button-foreground); border: none; padding: 8px 16px; cursor: pointer; }
  </style>
</head>
<body>
  <h1>My Tool</h1>
  <button onclick="hello()">Hello</button>
  <script>
    function hello() { alert('Hello from extension!'); }
  </script>
</body>
</html>`;
  }
}
