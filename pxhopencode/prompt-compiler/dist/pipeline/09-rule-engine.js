import { DictionaryManager } from '../dictionaries/index.js';
const dict = new DictionaryManager();
export function applyRules(input) {
    const t0 = performance.now();
    const matches = dict.getFillerMatcher().searchUnique(input);
    let output = input;
    let removals = 0;
    const sorted = matches.sort((a, b) => b.end - b.start - (a.end - a.start));
    for (const match of sorted) {
        if (match.output !== '')
            continue;
        if (match.confidence < 0.6)
            continue;
        const before = output;
        output = output.slice(0, match.start) + output.slice(match.end);
        const fillersOnly = /^[\s,]*$/.test(output.slice(match.start, match.start));
        if (!fillersOnly) {
            const excess = before.length - output.length;
            if (excess <= match.end - match.start + 1) {
                output = before;
                continue;
            }
        }
        output = before.slice(0, match.start) + before.slice(match.end);
        if (output !== before)
            removals++;
    }
    output = output
        .replace(/[,\s]{2,}/g, ', ')
        .replace(/\s{2,}/g, ' ')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
    const ms = performance.now() - t0;
    return {
        output,
        removals,
        metric: { name: 'RuleEngine', ms, inputLength: input.length, outputLength: output.length },
    };
}
const GREETING_PATTERNS = [
    /^(hi|hello|hey|chào|xin chào|alo)\b\s*/i,
    /^(good morning|good afternoon|good evening)\b\s*/i,
];
const CLOSING_PATTERNS = [
    /\s*(thanks|thank you|cảm ơn|cám ơn|cheers|regards|best)\s*$/i,
    /\s*(have a nice day|have a good one|bye|tạm biệt)\s*$/i,
];
const REPETITION_PATTERNS = [
    /(\b\w+\b)(?:\s+\1\b)+/g,
    /(\b\w+\s+\w+\b)(?:\s+\1\b)+/g,
];
export function applyCleanupRules(input) {
    const t0 = performance.now();
    let output = input;
    for (const pattern of GREETING_PATTERNS) {
        output = output.replace(pattern, '');
    }
    for (const pattern of CLOSING_PATTERNS) {
        output = output.replace(pattern, '');
    }
    for (const pattern of REPETITION_PATTERNS) {
        output = output.replace(pattern, '$1');
    }
    output = output.trim();
    const ms = performance.now() - t0;
    return {
        output,
        metric: { name: 'CleanupRules', ms, inputLength: input.length, outputLength: output.length },
    };
}
//# sourceMappingURL=09-rule-engine.js.map