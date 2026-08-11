export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'silent';

interface LoggerConfig {
  level: LogLevel;
  prefix: string;
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  silent: 99,
};

export class Logger {
  private config: LoggerConfig;

  constructor(prefix: string = 'PromptCompiler', level: LogLevel = 'silent') {
    this.config = { prefix, level };
  }

  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVELS[level] >= LOG_LEVELS[this.config.level];
  }

  private format(level: string, message: string, data?: unknown): string {
    const ts = new Date().toISOString();
    const base = `[${ts}] [${this.config.prefix}] [${level}] ${message}`;
    if (data !== undefined) {
      return `${base} ${typeof data === 'string' ? data : JSON.stringify(data)}`;
    }
    return base;
  }

  debug(message: string, data?: unknown): void {
    if (!this.shouldLog('debug')) return;
    console.debug(this.format('DEBUG', message, data));
  }

  info(message: string, data?: unknown): void {
    if (!this.shouldLog('info')) return;
    console.info(this.format('INFO', message, data));
  }

  warn(message: string, data?: unknown): void {
    if (!this.shouldLog('warn')) return;
    console.warn(this.format('WARN', message, data));
  }

  error(message: string, data?: unknown): void {
    if (!this.shouldLog('error')) return;
    console.error(this.format('ERROR', message, data));
  }

  setLevel(level: LogLevel): void {
    this.config.level = level;
  }

  child(prefix: string): Logger {
    return new Logger(`${this.config.prefix}:${prefix}`, this.config.level);
  }
}

export const defaultLogger = new Logger();

export function createStageLogger(stage: string): Logger {
  return new Logger(`Stage:${stage}`, 'silent');
}
