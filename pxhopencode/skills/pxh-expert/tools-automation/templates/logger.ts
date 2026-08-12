import fs from "node:fs";

class AsyncLogger {
  private buffer: string[] = [];
  private flushing = false;
  private stream: fs.WriteStream;

  constructor(logPath: string) {
    this.stream = fs.createWriteStream(logPath, { flags: "a" });
    setInterval(() => this.flush(), 5000);
    process.on("exit", () => this.flush());
    process.on("uncaughtException", (err) => {
      this.error("Uncaught", err);
      this.flush();
    });
  }

  info(module: string, message: string, data?: any) {
    this.write("INFO", module, message, data);
  }

  warn(module: string, message: string, data?: any) {
    this.write("WARN", module, message, data);
  }

  error(module: string, error: Error, data?: any) {
    this.write("ERROR", module, error.message, { ...data, stack: error.stack });
  }

  private write(level: string, module: string, message: string, data?: any) {
    const entry = JSON.stringify({
      timestamp: new Date().toISOString(),
      level,
      module,
      message,
      data,
    });
    this.buffer.push(entry);
    if (this.buffer.length >= 50) this.flush();
  }

  private flush() {
    if (this.buffer.length === 0 || this.flushing) return;
    this.flushing = true;
    const lines = this.buffer.splice(0).join("\n") + "\n";
    this.stream.write(lines, () => {
      this.flushing = false;
    });
  }
}
