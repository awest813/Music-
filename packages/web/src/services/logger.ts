import { platform } from '../platform';

export type LogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error';

type LogMethod = (message: string) => Promise<void>;

export type ScopedLogger = {
  [K in LogLevel]: LogMethod;
};

const createScopedLogger = (scope: string): ScopedLogger => {
  const logWithScope = (level: LogLevel, message: string): Promise<void> => {
    const formattedMessage = `[${scope}] ${message}`;
    return platform.logger[level](formattedMessage);
  };

  return {
    trace: (message: string) => logWithScope('trace', message),
    debug: (message: string) => logWithScope('debug', message),
    info: (message: string) => logWithScope('info', message),
    warn: (message: string) => logWithScope('warn', message),
    error: (message: string) => logWithScope('error', message),
  };
};

export const LOG_SCOPES = [
  'app',
  'playback',
  'streaming',
  'plugins',
  'queue',
  'metadata',
] as const;

export type LogScope = (typeof LOG_SCOPES)[number];

type LoggerType = {
  [K in LogScope]: ScopedLogger;
};

export const Logger = LOG_SCOPES.reduce(
  (acc, scope) => {
    acc[scope] = createScopedLogger(scope);
    return acc;
  },
  {} as Record<LogScope, ScopedLogger>,
) as LoggerType;
