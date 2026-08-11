import { Trie } from '../engine/trie.js';
import { AhoCorasick } from '../engine/aho-corasick.js';
import { buildTechnicalTrie } from './technical.js';
import { buildPhraseMatcher, classifyOutput, getPhraseEntries } from './phrases.js';
import { getIntentPatterns } from './intents.js';
import { getConstraintPatterns } from './constraints.js';
import { buildFillerMatcher } from './fillers.js';
import { IntentPattern, ConstraintPattern } from '../types.js';

export class DictionaryManager {
  private technicalTrie: Trie;
  private phraseMatcher: AhoCorasick;
  private fillerMatcher: AhoCorasick;
  private intentPatterns: IntentPattern[];
  private constraintPatterns: ConstraintPattern[];

  constructor() {
    this.technicalTrie = buildTechnicalTrie();
    this.phraseMatcher = buildPhraseMatcher();
    this.fillerMatcher = buildFillerMatcher();
    this.intentPatterns = getIntentPatterns();
    this.constraintPatterns = getConstraintPatterns();
  }

  getTechnicalTrie(): Trie { return this.technicalTrie; }
  getPhraseMatcher(): AhoCorasick { return this.phraseMatcher; }
  getFillerMatcher(): AhoCorasick { return this.fillerMatcher; }
  getIntentPatterns(): IntentPattern[] { return this.intentPatterns; }
  getConstraintPatterns(): ConstraintPattern[] { return this.constraintPatterns; }
  classifyOutput(output: string): 'intent' | 'constraint' | 'action' { return classifyOutput(output); }
  getPhraseEntries(): Array<[string, string, number]> { return getPhraseEntries(); }

  reload(): void {
    this.technicalTrie = buildTechnicalTrie();
    this.phraseMatcher = buildPhraseMatcher();
    this.fillerMatcher = buildFillerMatcher();
    this.intentPatterns = getIntentPatterns();
    this.constraintPatterns = getConstraintPatterns();
  }

  getStats(): Record<string, number> {
    return {
      technicalTerms: this.technicalTrie.getSize(),
      phraseEntries: this.phraseMatcher.getSize(),
      fillerEntries: this.fillerMatcher.getSize(),
      intentPatterns: this.intentPatterns.length,
      constraintPatterns: this.constraintPatterns.length,
    };
  }
}

let defaultInstance: DictionaryManager | null = null;

export function getDictionaryManager(): DictionaryManager {
  if (!defaultInstance) defaultInstance = new DictionaryManager();
  return defaultInstance;
}

export function resetDictionaryManager(): void {
  defaultInstance = null;
}
