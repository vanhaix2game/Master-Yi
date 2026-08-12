import * as vscode from "vscode";

export function activate(context: vscode.ExtensionContext) {
  // Status bar item
  const statusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
  statusBar.text = "$(tools) Công cụ của tôi";
  statusBar.command = "mytool.open";
  statusBar.show();
  context.subscriptions.push(statusBar);

  // Command
  const disposable = vscode.commands.registerCommand("mytool.hello", () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showWarningMessage("Không có editor nào đang mở");
      return;
    }
    const selection = editor.selection;
    const text = editor.document.getText(selection);
    vscode.window.showInformationMessage(`Đã chọn: ${text.substring(0, 100)}`);
  });

  context.subscriptions.push(disposable);
}

export function deactivate() {
  // Cleanup resources
}
