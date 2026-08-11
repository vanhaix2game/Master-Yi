import { AhoCorasick } from '../engine/aho-corasick.js';
export declare function buildPhraseMatcher(): AhoCorasick;
export declare function getPhraseEntries(): Array<[string, string, number]>;
export declare function classifyOutput(output: string): 'intent' | 'constraint' | 'action';
//# sourceMappingURL=phrases.d.ts.map