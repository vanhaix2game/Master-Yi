export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'silent';
export declare class Logger {
    private config;
    constructor(prefix?: string, level?: LogLevel);
    private shouldLog;
    private format;
    debug(message: string, data?: unknown): void;
    info(message: string, data?: unknown): void;
    warn(message: string, data?: unknown): void;
    error(message: string, data?: unknown): void;
    setLevel(level: LogLevel): void;
    child(prefix: string): Logger;
}
export declare const defaultLogger: Logger;
export declare function createStageLogger(stage: string): Logger;
//# sourceMappingURL=logger.d.ts.map