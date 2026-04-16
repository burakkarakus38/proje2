/**
 * Logger utility for structured logging.
 * Per backend-rules.md: Global error handler logs server-side errors
 */

export enum LogLevel {
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
  DEBUG = 'DEBUG',
}

interface LogEntry {
  level: LogLevel;
  timestamp: string;
  message: string;
  data?: unknown;
  stack?: string;
}

export class Logger {
  private static formatLog(entry: LogEntry): string {
    const { level, timestamp, message, data } = entry;
    const dataStr = data ? ` | Data: ${JSON.stringify(data)}` : '';
    return `[${timestamp}] [${level}] ${message}${dataStr}`;
  }

  static info(message: string, data?: unknown): void {
    const entry: LogEntry = {
      level: LogLevel.INFO,
      timestamp: new Date().toISOString(),
      message,
      data,
    };
    console.log(this.formatLog(entry));
  }

  static warn(message: string, data?: unknown): void {
    const entry: LogEntry = {
      level: LogLevel.WARN,
      timestamp: new Date().toISOString(),
      message,
      data,
    };
    console.warn(this.formatLog(entry));
  }

  static error(message: string, error?: Error, data?: unknown): void {
    const entry: LogEntry = {
      level: LogLevel.ERROR,
      timestamp: new Date().toISOString(),
      message,
      data,
      stack: error?.stack,
    };
    console.error(this.formatLog(entry));
    if (error?.stack) {
      console.error(error.stack);
    }
  }

  static debug(message: string, data?: unknown): void {
    const entry: LogEntry = {
      level: LogLevel.DEBUG,
      timestamp: new Date().toISOString(),
      message,
      data,
    };
    if (process.env.NODE_ENV === 'development') {
      console.debug(this.formatLog(entry));
    }
  }
}
