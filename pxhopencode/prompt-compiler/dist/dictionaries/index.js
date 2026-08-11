import { buildTechnicalTrie } from './technical.js';
import { buildPhraseMatcher, classifyOutput, getPhraseEntries } from './phrases.js';
import { getIntentPatterns } from './intents.js';
import { getConstraintPatterns } from './constraints.js';
import { buildFillerMatcher } from './fillers.js';
export class DictionaryManager {
    technicalTrie;
    phraseMatcher;
    fillerMatcher;
    intentPatterns;
    constraintPatterns;
    constructor() {
        this.technicalTrie = buildTechnicalTrie();
        this.phraseMatcher = buildPhraseMatcher();
        this.fillerMatcher = buildFillerMatcher();
        this.intentPatterns = getIntentPatterns();
        this.constraintPatterns = getConstraintPatterns();
    }
    getTechnicalTrie() { return this.technicalTrie; }
    getPhraseMatcher() { return this.phraseMatcher; }
    getFillerMatcher() { return this.fillerMatcher; }
    getIntentPatterns() { return this.intentPatterns; }
    getConstraintPatterns() { return this.constraintPatterns; }
    classifyOutput(output) { return classifyOutput(output); }
    getPhraseEntries() { return getPhraseEntries(); }
    reload() {
        this.technicalTrie = buildTechnicalTrie();
        this.phraseMatcher = buildPhraseMatcher();
        this.fillerMatcher = buildFillerMatcher();
        this.intentPatterns = getIntentPatterns();
        this.constraintPatterns = getConstraintPatterns();
    }
    getStats() {
        return {
            technicalTerms: this.technicalTrie.getSize(),
            phraseEntries: this.phraseMatcher.getSize(),
            fillerEntries: this.fillerMatcher.getSize(),
            intentPatterns: this.intentPatterns.length,
            constraintPatterns: this.constraintPatterns.length,
        };
    }
}
let defaultInstance = null;
export function getDictionaryManager() {
    if (!defaultInstance)
        defaultInstance = new DictionaryManager();
    return defaultInstance;
}
export function resetDictionaryManager() {
    defaultInstance = null;
}
//# sourceMappingURL=index.js.map