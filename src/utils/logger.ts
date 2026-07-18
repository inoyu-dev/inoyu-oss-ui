/**
 * Simple logger. Avoid chalk here: Next/webpack default-interop compiles
 * `chalk.red(...)` as `e().red(...)`, which throws at runtime.
 */
class Logger {
  private static instance: Logger;
  private silent: boolean = false;

  private constructor() {}

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  setSilent(silent: boolean) {
    this.silent = silent;
  }

  log(...args: unknown[]) {
    if (!this.silent) {
      console.log(...args);
    }
  }

  error(...args: unknown[]) {
    // Always show errors
    console.error(...args);
  }

  info(...args: unknown[]) {
    if (!this.silent) {
      console.log('ℹ', ...args);
    }
  }

  success(...args: unknown[]) {
    if (!this.silent) {
      console.log('✓', ...args);
    }
  }

  warn(...args: unknown[]) {
    if (!this.silent) {
      console.warn('⚠', ...args);
    }
  }
}

export const logger = Logger.getInstance();
