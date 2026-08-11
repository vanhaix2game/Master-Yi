export interface ACMatch {
  pattern: string;
  output: string;
  start: number;
  end: number;
  confidence: number;
}

class ACNode {
  children: Map<string, ACNode> = new Map();
  fail: ACNode | null = null;
  output: string | null = null;
  pattern: string = '';
  confidence: number = 0;
  depth: number = 0;
}

export class AhoCorasick {
  private root: ACNode = new ACNode();
  private built = false;
  private size = 0;

  insert(pattern: string, output: string, confidence: number = 1.0): void {
    let node = this.root;
    const lower = pattern.toLowerCase();
    for (const ch of lower) {
      if (!node.children.has(ch)) {
        const child = new ACNode();
        child.depth = node.depth + 1;
        node.children.set(ch, child);
      }
      node = node.children.get(ch)!;
    }
    node.output = output;
    node.pattern = pattern;
    node.confidence = confidence;
    this.size++;
    this.built = false;
  }

  build(): void {
    const queue: ACNode[] = [];

    for (const [, child] of this.root.children) {
      child.fail = this.root;
      queue.push(child);
    }

    while (queue.length > 0) {
      const node = queue.shift()!;

      for (const [ch, child] of node.children) {
        let failNode = node.fail;

        while (failNode !== null && !failNode.children.has(ch)) {
          failNode = failNode.fail;
        }

        child.fail = failNode !== null ? (failNode.children.get(ch) ?? this.root) : this.root;

        if (child.fail.output !== null && child.output === null) {
          child.output = child.fail.output;
          child.confidence = child.fail.confidence;
        }

        queue.push(child);
      }
    }

    this.built = true;
  }

  search(input: string): ACMatch[] {
    if (!this.built) this.build();

    const matches: ACMatch[] = [];
    let node = this.root;
    const lower = input.toLowerCase();

    for (let i = 0; i < lower.length; i++) {
      const ch = lower[i];

      while (node !== this.root && !node.children.has(ch)) {
        node = node.fail!;
      }

      if (node.children.has(ch)) {
        node = node.children.get(ch)!;
      }

      if (node.output !== null) {
        matches.push({
          pattern: node.pattern,
          output: node.output,
          start: i - node.depth + 1,
          end: i + 1,
          confidence: node.confidence,
        });
      }

      let failNode = node.fail;
      while (failNode !== null && failNode.output !== null) {
        matches.push({
          pattern: failNode.pattern,
          output: failNode.output,
          start: i - failNode.depth + 1,
          end: i + 1,
          confidence: failNode.confidence,
        });
        failNode = failNode.fail;
      }
    }

    return matches;
  }

  searchUnique(input: string): ACMatch[] {
    const all = this.search(input);
    const seen = new Set<string>();
    return all.filter(m => {
      const key = `${m.start}:${m.end}:${m.output}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  getSize(): number {
    return this.size;
  }

  static fromEntries(entries: Array<[string, string, number?]>): AhoCorasick {
    const ac = new AhoCorasick();
    for (const [pattern, output, confidence] of entries) {
      ac.insert(pattern, output, confidence ?? 1.0);
    }
    ac.build();
    return ac;
  }
}
