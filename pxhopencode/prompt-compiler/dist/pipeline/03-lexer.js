import { DictionaryManager } from '../dictionaries/index.js';
const dict = new DictionaryManager();
const KEYWORD_MAP = {
    fix: 'intent', debug: 'intent', create: 'intent', generate: 'intent',
    add: 'intent', implement: 'intent', build: 'intent', write: 'intent',
    refactor: 'intent', review: 'intent', audit: 'intent', optimize: 'intent',
    design: 'intent', document: 'intent', test: 'intent', analyze: 'intent',
    read: 'intent', search: 'intent', find: 'intent', migrate: 'intent',
    deploy: 'intent', release: 'intent', update: 'intent', remove: 'intent',
    delete: 'intent', explain: 'intent', describe: 'intent',
    react: 'framework', vue: 'framework', angular: 'framework', svelte: 'framework',
    nextjs: 'framework', next: 'framework', nuxt: 'framework',
    express: 'framework', fastify: 'framework', django: 'framework',
    flask: 'framework', spring: 'framework', fastapi: 'framework',
    typescript: 'language', javascript: 'language', python: 'language',
    rust: 'language', golang: 'language', java: 'language', kotlin: 'language',
    swift: 'language', csharp: 'language', c: 'language', cpp: 'language',
    go: 'language',
    node: 'platform', deno: 'platform', bun: 'platform',
    docker: 'platform', vercel: 'platform', netlify: 'platform',
    aws: 'platform', gcp: 'platform', azure: 'platform',
    npm: 'command', yarn: 'command', pnpm: 'command',
    git: 'command', npx: 'command', cargo: 'command', pip: 'command',
};
export function lex(tokens) {
    const t0 = performance.now();
    const lexemes = [];
    for (const token of tokens) {
        const lower = token.value.toLowerCase();
        let category = 'unknown';
        let confidence = 0.5;
        if (token.type === 'whitespace' || token.type === 'symbol') {
            lexemes.push({ token, category: 'unknown', confidence: 0 });
            continue;
        }
        const trieResult = dict.getTechnicalTrie().search(lower);
        if (trieResult.found && trieResult.output) {
            const techLower = trieResult.output.toLowerCase();
            if (technicalIsFramework(techLower))
                category = 'framework';
            else if (technicalIsLanguage(techLower))
                category = 'language';
            else if (technicalIsPlatform(techLower))
                category = 'platform';
            else if (technicalIsLibrary(techLower))
                category = 'library';
            else
                category = 'technical_term';
            confidence = trieResult.confidence;
        }
        else if (lower in KEYWORD_MAP) {
            category = KEYWORD_MAP[lower];
            confidence = 0.9;
        }
        else if (token.type === 'path') {
            category = 'file_path';
            confidence = 0.9;
        }
        else if (token.type === 'command') {
            category = 'command';
            confidence = 0.9;
        }
        lexemes.push({ token, category: category, confidence });
    }
    const ms = performance.now() - t0;
    return {
        lexemes,
        metric: { name: 'Lexer', ms, inputLength: tokens.length, outputLength: lexemes.length },
    };
}
function technicalIsFramework(lower) {
    const fw = ['react', 'vue', 'angular', 'svelte', 'next.js', 'nuxt', 'express',
        'fastify', 'nestjs', 'django', 'flask', 'spring', 'fastapi', 'electron',
        'tailwind', 'bootstrap', 'phaser', 'three.js', 'unity', 'godot', 'react native'];
    return fw.includes(lower);
}
function technicalIsLanguage(lower) {
    const langs = ['typescript', 'javascript', 'python', 'rust', 'golang', 'go',
        'java', 'kotlin', 'swift', 'c#', 'c++', 'ruby', 'php', 'scala', 'r'];
    return langs.includes(lower);
}
function technicalIsPlatform(lower) {
    const platforms = ['node.js', 'nodejs', 'deno', 'bun', 'docker', 'vercel',
        'netlify', 'aws', 'gcp', 'azure', 'android', 'ios', 'linux', 'windows', 'macos'];
    return platforms.includes(lower);
}
function technicalIsLibrary(lower) {
    const libs = ['prisma', 'typeorm', 'drizzle', 'sequelize', 'graphql', 'redux',
        'zustand', 'jotai', 'axios', 'vitest', 'jest', 'playwright', 'cypress'];
    return libs.includes(lower);
}
//# sourceMappingURL=03-lexer.js.map