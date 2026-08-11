export class TrieNode {
  children: Map<string, TrieNode> = new Map();
  output: string | null = null;
  confidence: number = 0;
  isEnd: boolean = false;

  hasChild(ch: string): boolean {
    return this.children.has(ch);
  }

  getChild(ch: string): TrieNode | undefined {
    return this.children.get(ch);
  }

  addChild(ch: string, node: TrieNode): void {
    this.children.set(ch, node);
  }
}

export class Trie {
  private root: TrieNode = new TrieNode();
  private size = 0;

  insert(key: string, output: string, confidence: number = 1.0): void {
    let node = this.root;
    const lower = key.toLowerCase();
    for (const ch of lower) {
      if (!node.hasChild(ch)) {
        node.addChild(ch, new TrieNode());
      }
      node = node.getChild(ch)!;
    }
    node.output = output;
    node.confidence = confidence;
    node.isEnd = true;
    this.size++;
  }

  search(key: string): { found: boolean; output: string | null; confidence: number } {
    let node = this.root;
    const lower = key.toLowerCase();
    for (const ch of lower) {
      if (!node.hasChild(ch)) return { found: false, output: null, confidence: 0 };
      node = node.getChild(ch)!;
    }
    return {
      found: node.isEnd,
      output: node.output,
      confidence: node.confidence,
    };
  }

  startsWith(prefix: string): boolean {
    let node = this.root;
    const lower = prefix.toLowerCase();
    for (const ch of lower) {
      if (!node.hasChild(ch)) return false;
      node = node.getChild(ch)!;
    }
    return true;
  }

  longestMatch(input: string, startIndex: number = 0): { length: number; output: string | null; confidence: number } {
    let node = this.root;
    let bestLength = 0;
    let bestOutput: string | null = null;
    let bestConfidence = 0;
    const lower = input.toLowerCase();

    for (let i = startIndex; i < lower.length; i++) {
      const ch = lower[i];
      if (!node.hasChild(ch)) break;
      node = node.getChild(ch)!;
      if (node.isEnd) {
        bestLength = i - startIndex + 1;
        bestOutput = node.output;
        bestConfidence = node.confidence;
      }
    }
    return { length: bestLength, output: bestOutput, confidence: bestConfidence };
  }

  findAllMatches(input: string): Array<{ start: number; end: number; output: string; confidence: number }> {
    const matches: Array<{ start: number; end: number; output: string; confidence: number }> = [];
    const lower = input.toLowerCase();

    for (let i = 0; i < lower.length; i++) {
      const result = this.longestMatch(lower, i);
      if (result.length > 0 && result.output) {
        matches.push({
          start: i,
          end: i + result.length,
          output: result.output,
          confidence: result.confidence,
        });
      }
    }
    return matches;
  }

  getSize(): number {
    return this.size;
  }

  toJSON(): Record<string, unknown> {
    return { size: this.size };
  }

  static fromEntries(entries: Array<[string, string, number?]>): Trie {
    const trie = new Trie();
    for (const [key, output, confidence] of entries) {
      trie.insert(key, output, confidence ?? 1.0);
    }
    return trie;
  }
}
