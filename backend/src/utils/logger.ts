import { config } from '../config/env';

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

function formatMessage(level: LogLevel, message: string, ...args: unknown[]): string {
  const ts = new Date().toISOString();
  const extra = args.length ? ' ' + args.map((a) => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' ') : '';
  return `[${ts}] [${level.toUpperCase()}] ${message}${extra}`;
}

export const logger = {
  info(message: string, ...args: unknown[]): void {
    console.log(formatMessage('info', message, ...args));
  },
  warn(message: string, ...args: unknown[]): void {
    console.warn(formatMessage('warn', message, ...args));
  },
  error(message: string, ...args: unknown[]): void {
    console.error(formatMessage('error', message, ...args));
  },
  debug(message: string, ...args: unknown[]): void {
    if (config.nodeEnv === 'development') {
      console.debug(formatMessage('debug', message, ...args));
    }
  },
};