export type Intent = 'fix_bug' | 'debug' | 'explain' | 'generate_feature' | 'generate_game' | 'generate_api' | 'generate_ui' | 'refactor' | 'review_code' | 'security_audit' | 'performance_optimization' | 'architecture_design' | 'create_documentation' | 'write_tests' | 'optimize_prompt' | 'optimize_token' | 'analyze_project' | 'read_codebase' | 'search' | 'find_root_cause' | 'dependency_analysis' | 'migration' | 'deployment' | 'packaging' | 'release' | 'git_operations' | 'mcp_operations' | 'workspace_management' | 'multi_agent_coordination' | 'enhance_ui' | 'rapid_prototype' | 'integrate_systems' | 'refactor_vibe' | 'unknown';
export type Constraint = 'minimal_changes' | 'preserve_behavior' | 'backward_compatible' | 'no_breaking_changes' | 'keep_coding_style' | 'follow_architecture' | 'use_existing_utilities' | 'avoid_new_dependencies' | 'no_refactoring' | 'only_requested_files' | 'do_not_touch_tests' | 'offline_only' | 'token_efficient' | 'maintain_performance' | 'maintain_readability' | 'security_first' | 'cross_platform' | 'mobile_first' | 'accessibility_required' | 'no_hallucination';
export type Priority = 'critical' | 'high' | 'medium' | 'low';
export type OutputStyle = 'concise' | 'detailed' | 'standard';
export type OptimizationLevel = 0 | 1 | 2;
export type Backend = 'deepseek' | 'claude' | 'gpt' | 'gemini' | 'opencode' | 'codex' | 'qwen' | 'kimi';
export interface PromptIR {
    version: string;
    raw: string;
    normalized: string;
    intents: Intent[];
    constraints: Constraint[];
    target: {
        frameworks: string[];
        languages: string[];
        platforms: string[];
        libraries: string[];
    };
    files: FileRef[];
    actions: string[];
    priority: Priority;
    safety: SafetyConfig;
    outputStyle: OutputStyle;
    optimizationLevel: OptimizationLevel;
    context: ContextInfo;
}
export interface FileRef {
    path: string;
    action: 'read' | 'edit' | 'create' | 'delete' | 'analyze';
}
export interface SafetyConfig {
    preserveBehavior: boolean;
    noBreakingChanges: boolean;
    backwardCompatible: boolean;
    noHallucination: boolean;
}
export interface ContextInfo {
    projectType?: string;
    workspaceRoot?: string;
    branch?: string;
    language?: string;
}
export interface Token {
    value: string;
    type: TokenType;
    position: number;
    length: number;
}
export type TokenType = 'identifier' | 'keyword' | 'string' | 'number' | 'path' | 'command' | 'symbol' | 'whitespace' | 'code_block' | 'language' | 'framework' | 'library' | 'file_extension' | 'intent_word' | 'constraint_word' | 'filler' | 'technical_term' | 'unknown';
export interface Lexeme {
    token: Token;
    category: LexicalCategory;
    confidence: number;
}
export type LexicalCategory = 'intent' | 'constraint' | 'framework' | 'language' | 'platform' | 'library' | 'file_path' | 'command' | 'action' | 'technical_term' | 'project_name' | 'filler' | 'unknown';
export interface CompilerOptions {
    backend: Backend;
    optimizationLevel: OptimizationLevel;
    outputStyle: OutputStyle;
    preserveFillers?: boolean;
    customDictionaries?: string[];
    languagePacks?: string[];
}
export interface CompilerResult {
    ir: PromptIR;
    prompt: string;
    metrics: CompilerMetrics;
}
export interface CompilerMetrics {
    inputTokens: number;
    outputTokens: number;
    compressionRatio: number;
    stages: StageMetric[];
    totalMs: number;
}
export interface StageMetric {
    name: string;
    ms: number;
    inputLength: number;
    outputLength: number;
}
export interface BackendGenerator {
    name: Backend;
    generate(ir: PromptIR): string;
}
export interface DictionaryEntry {
    pattern: string;
    normalized: string;
    category: LexicalCategory;
    confidence: number;
}
export interface IntentPattern {
    patterns: RegExp[];
    intent: Intent;
    priority: number;
}
export interface ConstraintPattern {
    patterns: RegExp[];
    constraint: Constraint;
    priority: number;
}
export interface Plugin {
    name: string;
    version: string;
    hooks: PluginHooks;
}
export interface PluginHooks {
    beforeNormalize?: (input: string) => string;
    afterNormalize?: (input: string) => string;
    beforeTokenize?: (input: string) => string;
    afterTokenize?: (tokens: Token[]) => Token[];
    beforeLex?: (tokens: Token[]) => Token[];
    afterLex?: (lexemes: Lexeme[]) => Lexeme[];
    beforeParseIntent?: (lexemes: Lexeme[]) => Lexeme[];
    afterParseIntent?: (intents: Intent[]) => Intent[];
    beforeBuildIR?: (ir: Partial<PromptIR>) => Partial<PromptIR>;
    afterBuildIR?: (ir: PromptIR) => PromptIR;
    beforeGenerate?: (ir: PromptIR) => PromptIR;
    afterGenerate?: (prompt: string) => string;
}
//# sourceMappingURL=types.d.ts.map