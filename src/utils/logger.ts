import chalk from 'chalk';

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
    console.error(chalk.red(...args));
  }

  info(...args: unknown[]) {
    if (!this.silent) {
      console.log(chalk.blue('ℹ'), ...args);
    }
  }

  success(...args: unknown[]) {
    if (!this.silent) {
      console.log(chalk.green('✓'), ...args);
    }
  }

  warn(...args: unknown[]) {
    if (!this.silent) {
      console.log(chalk.yellow('⚠'), ...args);
    }
  }
}

export const logger = Logger.getInstance(); 