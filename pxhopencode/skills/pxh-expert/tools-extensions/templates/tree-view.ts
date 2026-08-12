class MyTreeItem extends vscode.TreeItem {
  constructor(
    public label: string,
    public collapsibleState: vscode.TreeItemCollapsibleState,
    public description?: string
  ) {
    super(label, collapsibleState);
  }
}

class MyTreeProvider implements vscode.TreeDataProvider<MyTreeItem> {
  private _onDidChangeTreeData = new vscode.EventEmitter<MyTreeItem | undefined>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  refresh(): void {
    this._onDidChangeTreeData.fire(undefined);
  }

  getTreeItem(element: MyTreeItem): vscode.TreeItem {
    return element;
  }

  getChildren(element?: MyTreeItem): Thenable<MyTreeItem[]> {
    if (element) return Promise.resolve([]);
    return Promise.resolve([
      new MyTreeItem("Item 1", vscode.TreeItemCollapsibleState.None, "Description"),
      new MyTreeItem("Item 2", vscode.TreeItemCollapsibleState.Collapsible, "Has children"),
    ]);
  }
}
