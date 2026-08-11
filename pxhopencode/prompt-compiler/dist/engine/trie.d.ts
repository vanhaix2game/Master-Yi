export declare class TrieNode {
    children: Map<string, TrieNode>;
    output: string | null;
    confidence: number;
    isEnd: boolean;
    hasChild(ch: string): boolean;
    getChild(ch: string): TrieNode | undefined;
    addChild(ch: string, node: TrieNode): void;
}
export declare class Trie {
    private root;
    private size;
    insert(key: string, output: string, confidence?: number): void;
    search(key: string): {
        found: boolean;
        output: string | null;
        confidence: number;
    };
    startsWith(prefix: string): boolean;
    longestMatch(input: string, startIndex?: number): {
        length: number;
        output: string | null;
        confidence: number;
    };
    findAllMatches(input: string): Array<{
        start: number;
        end: number;
        output: string;
        confidence: number;
    }>;
    getSize(): number;
    toJSON(): Record<string, unknown>;
    static fromEntries(entries: Array<[string, string, number?]>): Trie;
}
//# sourceMappingURL=trie.d.ts.map