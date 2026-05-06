import { produce } from 'immer';
import { create } from 'zustand';

import type { NuclearPlugin, PluginMetadata } from '@nuclearplayer/plugin-sdk';
import { NuclearPluginAPI } from '@nuclearplayer/plugin-sdk';

import { Logger } from '../services/logger';
import { createPluginAPI } from '../services/plugins/createPluginAPI';
import {
  installPluginToManagedDir,
  removeManagedPluginInstall,
} from '../services/plugins/pluginDir';
import { PluginLoader } from '../services/plugins/PluginLoader';
import {
  getRegistryEntry,
  PluginInstallationMethod,
  removeRegistryEntry,
  setRegistryEntryEnabled,
  upsertRegistryEntry,
} from '../services/plugins/pluginRegistry';
import { reportError } from '../utils/logging';

const allowedPermissions: string[] = [];

export type PluginState = {
  metadata: PluginMetadata;
  path: string;
  enabled: boolean;
  warning: boolean;
  warnings: string[];
  installationMethod: PluginInstallationMethod;
  originalPath?: string;
  instance?: NuclearPlugin;
  api?: NuclearPluginAPI;
  isLoading?: boolean;
};

type PluginStore = {
  plugins: Record<string, PluginState>;
  loadPluginFromPath: (path: string) => Promise<void>;
  unloadPlugin: (id: string) => Promise<void>;
  enablePlugin: (id: string) => Promise<void>;
  disablePlugin: (id: string) => Promise<void>;
  cleanupPluginInstance: (id: string) => Promise<void>;
  reloadPlugin: (id: string) => Promise<void>;
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

type LoadedPluginData = {
  metadata: PluginMetadata;
  managedPath: string;
  instance: NuclearPlugin;
  warnings: string[];
};

const loadPluginData = async (
  sourcePath: string,
  id: string,
  version: string,
): Promise<LoadedPluginData> => {
  const loader = new PluginLoader(sourcePath);
  const metadata = await loader.loadMetadata();

  const permissions = metadata.permissions || [];
  const unknownPermissions = permissions.filter(
    (p) => !allowedPermissions.includes(p),
  );
  const warnings: string[] = unknownPermissions.length
    ? [`Unknown permissions: ${unknownPermissions.join(', ')}`]
    : [];

  if (warnings.length > 0) {
    Logger.plugins.warn(
      `Plugin ${id} loaded with warnings: ${warnings.join(', ')}`,
    );
  }

  const managedPath = await installPluginToManagedDir(id, version, sourcePath);
  const managedPluginLoader = new PluginLoader(managedPath);
  const { instance } = await managedPluginLoader.load();

  return { metadata, managedPath, instance, warnings };
};

export const usePluginStore = create<PluginStore>((set, get) => ({
  plugins: {},

  loadPluginFromPath: async (path: string) => {
    Logger.plugins.info(`Loading plugin from path: ${path}`);
    try {
      const loader = new PluginLoader(path);
      const metadata = await loader.loadMetadata();
      const id = metadata.id;

      const state = get();
      if (state.plugins[id]) {
        Logger.plugins.debug(`Plugin ${id} already loaded, skipping`);
        return;
      }

      set(
        produce((draft: PluginStore) => {
          draft.plugins[id] = {
            metadata,
            path,
            enabled: false,
            warning: false,
            warnings: [],
            installationMethod: 'dev',
            isLoading: true,
          };
        }),
      );

      const existing = await getRegistryEntry(id);
      const installationMethod: PluginInstallationMethod =
        existing?.installationMethod ?? 'dev';
      const originalPath =
        installationMethod === 'dev' ? path : existing?.originalPath;

      Logger.plugins.debug(
        `Plugin ${id}: installationMethod=${installationMethod}, hasExistingEntry=${!!existing}`,
      );

      const {
        metadata: loadedMetadata,
        managedPath,
        instance,
        warnings,
      } = await loadPluginData(path, id, metadata.version);

      const now = new Date().toISOString();
      const wasEnabled = existing ? existing.enabled : false;

      const api = createPluginAPI(id, loadedMetadata.displayName);

      if (instance.onLoad) {
        Logger.plugins.debug(`Calling onLoad for ${id}`);
        await instance.onLoad(api);
      }

      await upsertRegistryEntry({
        id,
        version: loadedMetadata.version,
        path: managedPath,
        installationMethod,
        originalPath,
        enabled: false,
        installedAt: existing ? existing.installedAt : now,
        lastUpdatedAt: now,
        warnings,
      });

      set(
        produce((draft: PluginStore) => {
          draft.plugins[id] = {
            metadata: loadedMetadata,
            path: managedPath,
            enabled: false,
            warning: warnings.length > 0,
            warnings,
            installationMethod,
            originalPath,
            instance,
            api,
            isLoading: false,
          };
        }),
      );

      Logger.plugins.info(
        `Plugin ${id}@${loadedMetadata.version} loaded successfully`,
      );

      if (wasEnabled) {
        Logger.plugins.debug(
          `Auto-enabling plugin ${id} (was previously enabled)`,
        );
        await get().enablePlugin(id);
      }
    } catch (error) {
      await reportError('plugins', {
        userMessage: 'Failed to load plugin',
        error,
      });
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
        produce((state: PluginStore) => {
          state.plugins[id].enabled = true;
        }),
      );
      await setRegistryEntryEnabled(id, true);
      Logger.plugins.info(`Plugin ${id} enabled`);
    } catch (error) {
      set(
        produce((state: PluginStore) => {
          if (state.plugins[id]) {
            state.plugins[id].enabled = false;
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
        produce((state: PluginStore) => {
          state.plugins[id].enabled = false;
        }),
      );
      await setRegistryEntryEnabled(id, false);
      Logger.plugins.info(`Plugin ${id} disabled`);
    } catch (error) {
      set(
        produce((state: PluginStore) => {
          if (state.plugins[id]) {
            state.plugins[id].enabled = true;
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
    const plugin = usePluginStore.getState().plugins[id];
    if (!plugin) {
      Logger.plugins.error(`Cannot unload plugin ${id}: not found`);
      throw new Error(`Plugin ${id} not found`);
    }
    let unloadError: unknown = null;
    try {
      if (plugin.enabled && plugin.instance && plugin.api) {
        await get().disablePlugin(id);
      }
      if (plugin.instance?.onUnload && plugin.api) {
        Logger.plugins.debug(`Calling onUnload for ${id}`);
        await plugin.instance.onUnload(plugin.api);
      }
    } catch (error) {
      unloadError = error;
    }

    set((state) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { [id]: _removed, ...rest } = state.plugins;
      return { plugins: rest };
    });

    if (unloadError) {
      Logger.plugins.error(
        `Failed to unload plugin ${id}. It was removed, but might not have been able to complete cleanup.`,
      );
      throw unloadError;
    }
    Logger.plugins.info(`Plugin ${id} unloaded`);
  },

  cleanupPluginInstance: async (id: string) => {
    const plugin = usePluginStore.getState().plugins[id];
    if (!plugin) {
      throw new Error(`Plugin ${id} not found`);
    }
    if (plugin.enabled && plugin.instance && plugin.api) {
      await get().disablePlugin(id);
    }
    if (plugin.instance?.onUnload && plugin.api) {
      await plugin.instance.onUnload(plugin.api);
    }
  },

  reloadPlugin: async (id: string) => {
    Logger.plugins.info(`Reloading plugin ${id}`);
    const plugin = get().plugins[id];
    if (!plugin) {
      Logger.plugins.error(`Cannot reload plugin ${id}: not found`);
      throw new Error(`Plugin ${id} not found`);
    }
    if (plugin.installationMethod !== 'dev') {
      Logger.plugins.error(`Cannot reload plugin ${id}: not a dev plugin`);
      throw new Error(
        `Plugin ${id} cannot be reloaded. Reinstall it from the store.`,
      );
    }
    if (!plugin.originalPath) {
      Logger.plugins.error(`Cannot reload plugin ${id}: no original path`);
      throw new Error(`Plugin ${id} has no original path`);
    }

    const wasEnabled = plugin.enabled;
    const originalPath = plugin.originalPath;
    const currentVersion = plugin.metadata.version;
    Logger.plugins.debug(
      `Plugin ${id}: wasEnabled=${wasEnabled}, currentVersion=${currentVersion}`,
    );

    try {
      set(
        produce((draft: PluginStore) => {
          draft.plugins[id].isLoading = true;
        }),
      );

      await get().cleanupPluginInstance(id);

      const {
        metadata: loadedMetadata,
        managedPath,
        instance,
        warnings,
      } = await loadPluginData(originalPath, id, currentVersion);

      const api = createPluginAPI(id, loadedMetadata.displayName);
      const newVersion = loadedMetadata.version;

      if (instance.onLoad) {
        Logger.plugins.debug(`Calling onLoad for ${id} after reload`);
        await instance.onLoad(api);
      }

      const now = new Date().toISOString();
      const existingEntry = await getRegistryEntry(id);
      const installedAt =
        currentVersion === newVersion && existingEntry
          ? existingEntry.installedAt
          : now;

      await upsertRegistryEntry({
        id,
        version: loadedMetadata.version,
        path: managedPath,
        installationMethod: 'dev',
        originalPath,
        enabled: false,
        installedAt,
        lastUpdatedAt: now,
        warnings,
      });

      set(
        produce((draft: PluginStore) => {
          draft.plugins[id] = {
            metadata: loadedMetadata,
            path: managedPath,
            enabled: false,
            warning: warnings.length > 0,
            warnings,
            installationMethod: 'dev',
            originalPath,
            instance,
            api,
            isLoading: false,
          };
        }),
      );

      Logger.plugins.info(
        `Plugin ${id} reloaded successfully (${currentVersion} -> ${loadedMetadata.version})`,
      );

      if (wasEnabled) {
        Logger.plugins.debug(`Re-enabling plugin ${id} after reload`);
        await get().enablePlugin(id);
      }
    } catch (error) {
      set(
        produce((draft: PluginStore) => {
          if (draft.plugins[id]) {
            draft.plugins[id].isLoading = false;
          }
        }),
      );
      await reportError('plugins', {
        userMessage: 'Failed to reload plugin',
        error,
      });
      throw error;
    }
  },

  removePlugin: async (id: string) => {
    Logger.plugins.info(`Removing plugin ${id}`);
    const plugin = get().plugins[id];
    const fallbackEntry = plugin ? undefined : await getRegistryEntry(id);
    if (!plugin && !fallbackEntry) {
      Logger.plugins.error(`Cannot remove plugin ${id}: not found`);
      throw new Error(`Plugin ${id} not found`);
    }
    const managedPath = plugin ? plugin.path : fallbackEntry!.path;
    try {
      if (plugin) {
        await get().unloadPlugin(id);
      }
      await removeManagedPluginInstall(managedPath);
      await removeRegistryEntry(id);
      Logger.plugins.info(`Plugin ${id} removed successfully`);
    } catch (error) {
      await reportError('plugins', {
        userMessage: 'Failed to remove plugin',
        error,
      });
      throw error;
    }
  },

  getPlugin: (id: string) => get().plugins[id],
  getAllPlugins: () => Object.values(get().plugins),
}));
