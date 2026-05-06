import { NuclearPluginAPI } from '@nuclearplayer/plugin-sdk';

import { platform } from '../platform';
import { dashboardHost } from './dashboardHost';
import { discoveryHost } from './discoveryHost';
import { eventBus } from './eventBus';
import { favoritesHost } from './favoritesHost';
import { httpHost } from './httpHost';
import { metadataHost } from './metadataHost';
import { playbackHost } from './playbackHost';
import { playlistsHost } from './playlistsHost';
import { providersHost } from './providersHost';
import { queueHost } from './queueHost';
import { createPluginSettingsHost } from './settingsHost';
import { shellHost } from './shellHost';
import { streamingHost } from './streamingHost';
import { widgetRegistry } from './widgetRegistry';
import { ytdlpHost } from './ytdlpHost';

const sanitizePluginId = (pluginId: string): string => {
  if (!pluginId || typeof pluginId !== 'string') {
    return 'unknown';
  }
  return pluginId.replace(/[[\]\n\r]/g, '_');
};

export const createPluginAPI = (
  pluginId: string,
  displayName: string,
): NuclearPluginAPI => {
  const sanitized = sanitizePluginId(pluginId);
  const logWithScope = (
    level: 'trace' | 'debug' | 'info' | 'warn' | 'error',
    message: string,
  ) => {
    const formattedMessage = `[plugin:${sanitized}] ${message}`;
    return platform.logger[level](formattedMessage);
  };
  const pluginLoggerHost = {
    log: (
      level: 'trace' | 'debug' | 'info' | 'warn' | 'error',
      message: string,
    ) => {
      void logWithScope(level, message);
    },
  };

  return new NuclearPluginAPI({
    settingsHost: createPluginSettingsHost(pluginId, displayName),
    queueHost,
    providersHost,
    streamingHost,
    metadataHost,
    httpHost,
    ytdlpHost,
    favoritesHost,
    playbackHost,
    playlistsHost,
    dashboardHost,
    discoveryHost,
    eventsHost: eventBus,
    shellHost,
    widgetRegistry,
    pluginId,
    loggerHost: pluginLoggerHost,
  });
};
