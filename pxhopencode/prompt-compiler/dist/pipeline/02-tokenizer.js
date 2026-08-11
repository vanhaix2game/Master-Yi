import { isCJK } from '../utils/unicode.js';
const IDENTIFIER = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/;
const NUMBER = /^[0-9]+(\.[0-9]+)?$/;
const FILE_PATH = /^[./~][a-zA-Z0-9_\-./\\]*$/;
const COMMAND = /^\/[a-z][a-zA-Z0-9_-]*$/;
const FILE_EXT = /^\.[a-zA-Z0-9]+$/;
const STRING = /^['"`].*['"`]$/;
function classifyWord(word) {
    if (COMMAND.test(word))
        return 'command';
    if (FILE_EXT.test(word))
        return 'file_extension';
    if (FILE_PATH.test(word))
        return 'path';
    if (IDENTIFIER.test(word))
        return 'identifier';
    if (NUMBER.test(word))
        return 'number';
    if (STRING.test(word))
        return 'string';
    return 'unknown';
}
export function tokenize(input) {
    const t0 = performance.now();
    const tokens = [];
    let i = 0;
    while (i < input.length) {
        if (input[i] === ' ' || input[i] === '\t') {
            const start = i;
            while (i < input.length && (input[i] === ' ' || input[i] === '\t'))
                i++;
            tokens.push({ value: input.slice(start, i), type: 'whitespace', position: start, length: i - start });
            continue;
        }
        if (input[i] === '\n') {
            tokens.push({ value: '\n', type: 'whitespace', position: i, length: 1 });
            i++;
            continue;
        }
        if (input[i] === '`' && input.slice(i, i + 3) === '```') {
            const end = input.indexOf('```', i + 3);
            if (end !== -1) {
                const code = input.slice(i, end + 3);
                tokens.push({ value: code, type: 'code_block', position: i, length: code.length });
                i = end + 3;
                continue;
            }
        }
        if (input[i] === '`') {
            const end = input.indexOf('`', i + 1);
            if (end !== -1) {
                const code = input.slice(i, end + 1);
                tokens.push({ value: code, type: 'string', position: i, length: code.length });
                i = end + 1;
                continue;
            }
        }
        if (isCJK(input[i]) || /[a-zA-Z0-9_$]/.test(input[i])) {
            const start = i;
            while (i < input.length && (isCJK(input[i]) || /[a-zA-Z0-9_$]/.test(input[i])))
                i++;
            const word = input.slice(start, i);
            const type = classifyWord(word);
            tokens.push({ value: word, type, position: start, length: i - start });
            continue;
        }
        if (/[{}()\[\]<>+\-*/%=!&|^~@#:;,.?]/.test(input[i])) {
            const start = i;
            while (i < input.length && /[{}()\[\]<>+\-*/%=!&|^~@#:;,.?]/.test(input[i]))
                i++;
            tokens.push({ value: input.slice(start, i), type: 'symbol', position: start, length: i - start });
            continue;
        }
        tokens.push({ value: input[i], type: 'unknown', position: i, length: 1 });
        i++;
    }
    const ms = performance.now() - t0;
    return {
        tokens,
        metric: { name: 'Tokenizer', ms, inputLength: input.length, outputLength: tokens.length },
    };
}
//# sourceMappingURL=02-tokenizer.js.map