import { Trie } from '../engine/trie.js';
import { AhoCorasick } from '../engine/aho-corasick.js';
import { IntentPattern, ConstraintPattern } from '../types.js';
export declare class DictionaryManager {
    private technicalTrie;
    private phraseMatcher;
    private fillerMatcher;
    private intentPatterns;
    private constraintPatterns;
    constructor();
    getTechnicalTrie(): Trie;
    getPhraseMatcher(): AhoCorasick;
    getFillerMatcher(): AhoCorasick;
    getIntentPatterns(): IntentPattern[];
    getConstraintPatterns(): ConstraintPattern[];
    classifyOutput(output: string): 'intent' | 'constraint' | 'action';
    getPhraseEntries(): Array<[string, string, number]>;
    reload(): void;
    getStats(): Record<string, number>;
}
export declare function getDictionaryManager(): DictionaryManager;
export declare function resetDictionaryManager(): void;
//# sourceMappingURL=index.d.ts.map