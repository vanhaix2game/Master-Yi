class BatchProcessor<T, R> {
  private queue: T[] = [];
  private running = 0;
  private results: R[] = [];
  private errors: Error[] = [];

  constructor(
    private handler: (item: T) => Promise<R>,
    private concurrency: number = 5,
    private onProgress?: (done: number, total: number) => void
  ) {}

  async process(items: T[]): Promise<{ results: R[]; errors: Error[] }> {
    this.queue = [...items];
    this.results = [];
    this.errors = [];
    this.running = 0;

    const workers = Array.from({ length: Math.min(this.concurrency, items.length) }, () => this.worker());
    await Promise.all(workers);

    return { results: this.results, errors: this.errors };
  }

  private async worker() {
    while (this.queue.length > 0) {
      const item = this.queue.shift()!;
      this.running++;
      try {
        const result = await this.handler(item);
        this.results.push(result);
      } catch (err) {
        this.errors.push(err as Error);
      }
      this.running--;
      this.onProgress?.(this.results.length + this.errors.length, this.results.length + this.errors.length + this.queue.length);
    }
  }
}
