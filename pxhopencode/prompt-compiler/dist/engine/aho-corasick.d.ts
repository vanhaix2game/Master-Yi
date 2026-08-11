export interface ACMatch {
    pattern: string;
    output: string;
    start: number;
    end: number;
    confidence: number;
}
export declare class AhoCorasick {
    private root;
    private built;
    private size;
    insert(pattern: string, output: string, confidence?: number): void;
    build(): void;
    search(input: string): ACMatch[];
    searchUnique(input: string): ACMatch[];
    getSize(): number;
    static fromEntries(entries: Array<[string, string, number?]>): AhoCorasick;
}
//# sourceMappingURL=aho-corasick.d.ts.map