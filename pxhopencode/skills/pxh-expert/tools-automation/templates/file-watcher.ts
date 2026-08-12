import chokidar from "chokidar";
import { debounce } from "lodash-es";

class FileWatcher {
  private watcher: chokidar.FSWatcher;
  private onChange: debounce<() => Promise<void>>;

  constructor(
    private patterns: string[],
    private handler: () => Promise<void>,
    private options: { debounceMs?: number; ignoreInitial?: boolean } = {}
  ) {
    this.onChange = debounce(() => this.safeHandle(), options.debounceMs ?? 300);
    this.watcher = chokidar.watch(patterns, {
      ignored: /(^|[\/\\])\../,
      persistent: true,
      ignoreInitial: options.ignoreInitial ?? true,
    });
    this.watcher.on("change", () => this.onChange());
    this.watcher.on("add", () => this.onChange());
    this.watcher.on("unlink", () => this.onChange());
  }

  private async safeHandle() {
    try {
      await this.handler();
    } catch (err) {
      console.error(`[Watcher] Error:`, err);
    }
  }

  close() {
    this.watcher.close();
  }
}
