import { normalizeUnicode } from '../utils/unicode.js';
export function unicodeNormalize(input) {
    const t0 = performance.now();
    const output = normalizeUnicode(input);
    const ms = performance.now() - t0;
    return {
        output,
        metric: { name: 'UnicodeNormalizer', ms, inputLength: input.length, outputLength: output.length },
    };
}
//# sourceMappingURL=01-unicode-normalizer.js.map