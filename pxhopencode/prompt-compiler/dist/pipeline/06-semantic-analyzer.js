import { DictionaryManager } from '../dictionaries/index.js';
const dict = new DictionaryManager();
export function analyzeSemantics(input, _lexemes, constraints) {
    const t0 = performance.now();
    const matches = dict.getPhraseMatcher().searchUnique(input);
    let normalized = input;
    const actions = [];
    const applied = new Set();
    for (const match of matches.sort((a, b) => b.confidence - a.confidence)) {
        if (applied.has(match.output))
            continue;
        applied.add(match.output);
        const category = dict.classifyOutput(match.output);
        if (category === 'action' || category === 'intent') {
            actions.push(match.output);
        }
        if (category === 'constraint') {
            const constraintMatch = constraints.find(c => c.toLowerCase().includes(match.output.slice(0, 10)));
            if (!constraintMatch)
                actions.push(match.output);
        }
    }
    const ms = performance.now() - t0;
    return {
        normalized,
        actions: [...new Set(actions)],
        metric: { name: 'SemanticAnalyzer', ms, inputLength: input.length, outputLength: actions.length },
    };
}
export function normalizeDevPhrases(input) {
    let output = input;
    let replacements = 0;
    const devPhrases = [
        [/đừng phá code/gi, 'preserve existing behavior'],
        [/không (?:được )?phá (?:code|code cũ)/gi, 'preserve existing behavior'],
        [/không (?:được )?làm hỏng/gi, 'preserve existing behavior'],
        [/giữ nguyên (?:hành vi|chức năng|code|behavior)/gi, 'preserve existing behavior'],
        [/không (?:được )?(?:đụng|chạm|sửa) (?:tới|vào|đến) (?:test|code khác)/gi, 'do not touch'],
        [/chỉ (?:sửa|thay đổi) (?:trong|ở) (?:file|những)/gi, 'modify only'],
        [/thay đổi tối thiểu/gi, 'minimal changes'],
        [/tìm (?:ra )?nguyên nhân/gi, 'identify root cause'],
        [/chia nhỏ/gi, 'modularization'],
        [/đọc (?:project|source|code|mã nguồn)/gi, 'analyze codebase'],
        [/sửa (?:bug|lỗi)/gi, 'fix bug'],
        [/rà soát/gi, 'review'],
        [/make it pop/gi, 'enhance visual appeal'],
        [/give it some sauce/gi, 'enhance visual appeal'],
        [/the vibes are off/gi, 'fix aesthetic UX issues'],
        [/ship it/gi, 'prepare for deployment'],
        [/glue (?:together|code)/gi, 'integrate components'],
        [/wire it up/gi, 'connect integrate'],
        [/clean it up/gi, 'refactor for clarity'],
        [/make it work/gi, 'ensure functionality'],
        [/throw (?:something )?together/gi, 'rapid prototype'],
        [/cobble together/gi, 'implement with available resources'],
        [/just get it done/gi, 'implement with minimal ceremony'],
        [/chạy tạm/gi, 'ensure functionality'],
        [/đập đi xây lại/gi, 'rewrite from scratch'],
        [/chắp vá/gi, 'integrate disparate components'],
        [/làm cho (?:đẹp|pro|xịn)/gi, 'enhance visual appeal'],
        [/nối dây|đấu nối/gi, 'connect integrate'],
        [/fix đê|sửa đê/gi, 'fix bug'],
        [/lên production|đẩy lên/gi, 'prepare for deployment'],
        [/làm nhanh|làm tạm/gi, 'rapid prototype'],
        [/code cứt/gi, 'poor quality code'],
        [/xịn xò/gi, 'high quality implementation'],
    ];
    for (const [pattern, replacement] of devPhrases) {
        const before = output;
        output = output.replace(pattern, replacement);
        if (output !== before)
            replacements++;
    }
    return { output, replacements };
}
//# sourceMappingURL=06-semantic-analyzer.js.map