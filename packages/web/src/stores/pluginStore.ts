import { produce } from 'immer';
import { create } from 'zustand';

import type { NuclearPlugin, PluginMetadata } from '@nuclearplayer/plugin-sdk';
import { NuclearPluginAPI } from '@nuclearplayer/plugin-sdk';

import { createPluginAPI } from '../services/createPluginAPI';
import { Logger } from '../services/logger';
import { PluginLoader } from '../services/pluginLoader';
import {
  getRegistryEntry,
  PluginInstallationMethod,
  removeRegistryEntry,
  setRegistryEntryEnabled,
  upsertRegistryEntry,
} from '../services/pluginRegistry';

const ALLOWED_MODULES: Record<string, unknown> = {
  '@nuclearplayer/plugin-sdk': { NuclearPluginAPI },
  '@nuclearplayer/ui': {},
  react: {},
  'react/jsx-runtime': {},
};

export type PluginState = {
  metadata: PluginMetadata;
  url: string;
  enabled: boolean;
  warning: boolean;
  warnings: string[];
  installationMethod: PluginInstallationMethod;
  instance?: NuclearPlugin;
  api?: NuclearPluginAPI;
  isLoading?: boolean;
};

type PluginStore = {
  plugins: Record<string, PluginState>;
  loadPluginFromUrl: (url: string) => Promise<void>;
  unloadPlugin: (id: string) => Promise<void>;
  enablePlugin: (id: string) => Promise<void>;
  disablePlugin: (id: string) => Promise<void>;
  removePlugin: (id: string) => Promise<void>;
  getPlugin: (id: string) => PluginState | undefined;
  getAllPlugins: () => PluginState[];
};

const requireInstance = (id: string) => {
  const plugin = usePluginStore.getState().plugins[id];
  if (!plugin) {
    throw new Error(`Plugin ${id} not found`);
  }
  if (!plugin.instance) {
    throw new Error(`Plugin ${id} has no instance`);
  }
  if (!plugin.api) {
    throw new Error(`Plugin ${id} has no API`);
  }
  return plugin as PluginState & {
    instance: NuclearPlugin;
    api: NuclearPluginAPI;
  };
};

const loadingPlugins = new Set<string>();

export const usePluginStore = create<PluginStore>((set, get) => ({
  plugins: {},

  loadPluginFromUrl: async (url: string) => {
    Logger.plugins.info(`Loading plugin from URL: ${url}`);
    const loader = new PluginLoader(url);
    let pluginId: string | null = null;
    try {
      const metadata = await loader.loadMetadata();
      pluginId = metadata.id;

      if (!pluginId) {
        return;
      }
      const id = pluginId;

      if (get().plugins[id] || loadingPlugins.has(id)) {
        Logger.plugins.debug(
          `Plugin ${id} already loading or loaded, skipping`,
        );
        return;
      }

      loadingPlugins.add(id);

      const existing = await getRegistryEntry(id);
      const installationMethod: PluginInstallationMethod =
        existing?.installationMethod ?? 'local';

      Logger.plugins.debug(
        `Plugin ${id}: installationMethod=${installationMethod}, hasExistingEntry=${!!existing}`,
      );

      const warnings = loader.getWarnings();
      const { instance } = await loader.load(ALLOWED_MODULES);

      const now = new Date().toISOString();

      const api = createPluginAPI(id, metadata.displayName);

      if (instance.onLoad) {
        Logger.plugins.debug(`Calling onLoad for ${id}`);
        await instance.onLoad(api);
      }

      await upsertRegistryEntry({
        id,
        version: metadata.version,
        path: url,
        installationMethod,
        enabled: false,
        installedAt: existing ? existing.installedAt : now,
        lastUpdatedAt: now,
        warnings,
      });

      set(
        produce((draft: PluginStore) => {
          draft.plugins[id] = {
            metadata,
            url,
            enabled: false,
            warning: warnings.length > 0,
            warnings,
            installationMethod,
            instance,
            api,
          };
        }),
      );

      Logger.plugins.info(
        `Plugin ${id}@${metadata.version} loaded successfully`,
      );

      if (existing?.enabled) {
        Logger.plugins.debug(`Auto-enabling plugin ${id}`);
        await get().enablePlugin(id);
      }
    } catch (error) {
      Logger.plugins.error(
        `Failed to load plugin from ${url}: ${error instanceof Error ? error.message : String(error)}`,
      );
    } finally {
      if (pluginId) {
        loadingPlugins.delete(pluginId);
      }
    }
  },

  enablePlugin: async (id: string) => {
    Logger.plugins.debug(`Enabling plugin ${id}`);
    const plugin = requireInstance(id);
    if (plugin.enabled) {
      Logger.plugins.debug(`Plugin ${id} is already enabled, skipping`);
      return;
    }
    try {
      if (plugin.instance.onEnable) {
        Logger.plugins.debug(`Calling onEnable for ${id}`);
        await plugin.instance.onEnable(plugin.api);
      }
      set(
        produce((draft: PluginStore) => {
          draft.plugins[id].enabled = true;
        }),
      );
      await setRegistryEntryEnabled(id, true);
      Logger.plugins.info(`Plugin ${id} enabled`);
    } catch (error) {
      set(
        produce((draft: PluginStore) => {
          if (draft.plugins[id]) {
            draft.plugins[id].enabled = false;
          }
        }),
      );
      Logger.plugins.error(
        `Failed to enable plugin ${id}: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  },

  disablePlugin: async (id: string) => {
    Logger.plugins.debug(`Disabling plugin ${id}`);
    const plugin = requireInstance(id);
    if (!plugin.enabled) {
      Logger.plugins.debug(`Plugin ${id} is already disabled, skipping`);
      return;
    }
    try {
      if (plugin.instance.onDisable) {
        Logger.plugins.debug(`Calling onDisable for ${id}`);
        await plugin.instance.onDisable(plugin.api);
      }
      set(
        produce((draft: PluginStore) => {
          draft.plugins[id].enabled = false;
        }),
      );
      await setRegistryEntryEnabled(id, false);
      Logger.plugins.info(`Plugin ${id} disabled`);
    } catch (error) {
      set(
        produce((draft: PluginStore) => {
          if (draft.plugins[id]) {
            draft.plugins[id].enabled = true;
          }
        }),
      );
      Logger.plugins.error(
        `Failed to disable plugin ${id}: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  },

  unloadPlugin: async (id: string) => {
    Logger.plugins.debug(`Unloading plugin ${id}`);
    const plugin = get().plugins[id];
    if (!plugin) {
      Logger.plugins.error(`Cannot unload plugin ${id}: not found`);
      throw new Error(`Plugin ${id} not found`);
    }
    if (plugin.enabled && plugin.instance && plugin.api) {
      await get().disablePlugin(id);
    }
    if (plugin.instance?.onUnload && plugin.api) {
      Logger.plugins.debug(`Calling onUnload for ${id}`);
      await plugin.instance.onUnload(plugin.api);
    }
    set((state) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { [id]: _removed, ...rest } = state.plugins;
      return { plugins: rest };
    });
    Logger.plugins.info(`Plugin ${id} unloaded`);
  },

  removePlugin: async (id: string) => {
    Logger.plugins.info(`Removing plugin ${id}`);
    const plugin = get().plugins[id];
    if (!plugin) {
      Logger.plugins.error(`Cannot remove plugin ${id}: not found`);
      throw new Error(`Plugin ${id} not found`);
    }
    await get().unloadPlugin(id);
    await removeRegistryEntry(id);
    Logger.plugins.info(`Plugin ${id} removed successfully`);
  },

  getPlugin: (id: string) => get().plugins[id],
  getAllPlugins: () => Object.values(get().plugins),
}));
