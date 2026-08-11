const LOG_LEVELS = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
    silent: 99,
};
export class Logger {
    config;
    constructor(prefix = 'PromptCompiler', level = 'silent') {
        this.config = { prefix, level };
    }
    shouldLog(level) {
        return LOG_LEVELS[level] >= LOG_LEVELS[this.config.level];
    }
    format(level, message, data) {
        const ts = new Date().toISOString();
        const base = `[${ts}] [${this.config.prefix}] [${level}] ${message}`;
        if (data !== undefined) {
            return `${base} ${typeof data === 'string' ? data : JSON.stringify(data)}`;
        }
        return base;
    }
    debug(message, data) {
        if (!this.shouldLog('debug'))
            return;
        console.debug(this.format('DEBUG', message, data));
    }
    info(message, data) {
        if (!this.shouldLog('info'))
            return;
        console.info(this.format('INFO', message, data));
    }
    warn(message, data) {
        if (!this.shouldLog('warn'))
            return;
        console.warn(this.format('WARN', message, data));
    }
    error(message, data) {
        if (!this.shouldLog('error'))
            return;
        console.error(this.format('ERROR', message, data));
    }
    setLevel(level) {
        this.config.level = level;
    }
    child(prefix) {
        return new Logger(`${this.config.prefix}:${prefix}`, this.config.level);
    }
}
export const defaultLogger = new Logger();
export function createStageLogger(stage) {
    return new Logger(`Stage:${stage}`, 'silent');
}
//# sourceMappingURL=logger.js.map