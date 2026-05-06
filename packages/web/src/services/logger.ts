import type { LoggerHost } from '@nuclearplayer/plugin-sdk';

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
  'dashboard',
  'discovery',
  'playback',
  'streaming',
  'plugins',
  'http',
  'settings',
  'queue',
  'metadata',
  'playlists',
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

export const webLogger = Logger;

const sanitizePluginId = (pluginId: string): string => {
  if (!pluginId || typeof pluginId !== 'string') {
    return 'unknown';
  }
  return pluginId.replace(/[[\]\n\r]/g, '_');
};

export const createPluginLogger = (pluginId: string): ScopedLogger => {
  const sanitized = sanitizePluginId(pluginId);
  return createScopedLogger(`plugin:${sanitized}`);
};

export const createLoggerHost = (pluginId: string): LoggerHost => {
  const pluginLogger = createPluginLogger(pluginId);
  return {
    log: (level, message) => {
      void pluginLogger[level](message);
    },
  };
};
