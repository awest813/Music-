import { LazyStore } from '@tauri-apps/plugin-store';

import type {
  Platform,
  PlatformDirectory,
  PlatformFileOptions,
  PlatformStorageStore,
  PlatformWatchOptions,
} from './types';

const toBaseDirectory = async (directory: PlatformDirectory | undefined) => {
  const { BaseDirectory } = await import('@tauri-apps/plugin-fs');
  switch (directory) {
    case 'appData':
      return BaseDirectory.AppData;
    case 'document':
      return BaseDirectory.Document;
    case 'download':
      return BaseDirectory.Download;
    default:
      return undefined;
  }
};

const toFileOptions = async (options?: PlatformFileOptions) => ({
  baseDir: await toBaseDirectory(options?.baseDir),
});

const toWatchOptions = async (options?: PlatformWatchOptions) => ({
  baseDir: await toBaseDirectory(options?.baseDir),
});

const createTauriStorageStore = (path: string): PlatformStorageStore => {
  const store = new LazyStore(path);
  return {
    get: (key) => store.get(key),
    set: (key, value) => store.set(key, value),
    delete: (key) => store.delete(key).then(() => undefined),
    clear: () => store.clear(),
    entries: () => store.entries(),
    save: () => store.save(),
    close: () => store.close(),
  };
};

const logWithTauri = async (
  level: 'trace' | 'debug' | 'info' | 'warn' | 'error',
  message: string,
): Promise<void> => {
  try {
    const tauriLog = await import('@tauri-apps/plugin-log');
    await tauriLog[level](message);
  } catch {
    console[level](message);
  }
};

export const tauriPlatform: Platform = {
  capabilities: {
    discord: true,
    filesystemWatch: true,
    nativeDialogs: true,
    nativeUpdater: true,
  },
  storage: {
    createStore: createTauriStorageStore,
  },
  fs: {
    readTextFile: async (path, options) => {
      const { readTextFile } = await import('@tauri-apps/plugin-fs');
      return readTextFile(path, await toFileOptions(options));
    },
    writeTextFile: async (path, contents, options) => {
      const { writeTextFile } = await import('@tauri-apps/plugin-fs');
      await writeTextFile(path, contents, await toFileOptions(options));
    },
    readDir: async (path, options) => {
      const { readDir } = await import('@tauri-apps/plugin-fs');
      const entries = await readDir(path, await toFileOptions(options));
      return entries.map((entry) => ({
        name: entry.name,
        isDirectory: entry.isDirectory,
      }));
    },
    remove: async (path, options) => {
      const { remove } = await import('@tauri-apps/plugin-fs');
      await remove(path, await toFileOptions(options));
    },
    mkdir: async (path, options) => {
      const { mkdir } = await import('@tauri-apps/plugin-fs');
      await mkdir(path, { ...(await toFileOptions(options)), recursive: true });
    },
    exists: async (path, options) => {
      const { exists } = await import('@tauri-apps/plugin-fs');
      return exists(path, await toFileOptions(options));
    },
    watchImmediate: async (path, handler, options) => {
      const { watchImmediate } = await import('@tauri-apps/plugin-fs');
      return watchImmediate(
        path,
        (event) => {
          void handler({ paths: event.paths });
        },
        await toWatchOptions(options),
      );
    },
    pickTextFile: async () => {
      const { readTextFile } = await import('@tauri-apps/plugin-fs');
      const { open } = await import('@tauri-apps/plugin-dialog');
      const picked = await open({ multiple: false });
      if (typeof picked !== 'string') {
        return null;
      }
      return {
        name: picked.split(/[\\/]/).at(-1) ?? picked,
        contents: await readTextFile(picked),
      };
    },
    saveTextFile: async (defaultPath, contents) => {
      const { writeTextFile } = await import('@tauri-apps/plugin-fs');
      const { save } = await import('@tauri-apps/plugin-dialog');
      const path = await save({ defaultPath });
      if (!path) {
        return null;
      }
      await writeTextFile(path, contents);
      return path;
    },
    join: async (...paths) => {
      const { join } = await import('@tauri-apps/api/path');
      return join(...paths);
    },
    appDataDir: async () => {
      const { appDataDir } = await import('@tauri-apps/api/path');
      return appDataDir();
    },
  },
  dialog: {
    open: async (options) => {
      const { open } = await import('@tauri-apps/plugin-dialog');
      return open(options as Parameters<typeof open>[0]);
    },
    save: async (options) => {
      const { save } = await import('@tauri-apps/plugin-dialog');
      return save(options as Parameters<typeof save>[0]);
    },
    message: async (text) => {
      const { message } = await import('@tauri-apps/plugin-dialog');
      await message(text);
    },
  },
  shell: {
    openUrl: async (url) => {
      const { openUrl } = await import('@tauri-apps/plugin-opener');
      await openUrl(url);
    },
    revealItemInDir: async (path) => {
      const { revealItemInDir } = await import('@tauri-apps/plugin-opener');
      await revealItemInDir(path);
    },
  },
  logger: {
    trace: (message) => logWithTauri('trace', message),
    debug: (message) => logWithTauri('debug', message),
    info: (message) => logWithTauri('info', message),
    warn: (message) => logWithTauri('warn', message),
    error: (message) => logWithTauri('error', message),
  },
  process: {
    exit: async (code) => {
      const { exit } = await import('@tauri-apps/plugin-process');
      await exit(code);
    },
    relaunch: async () => {
      const { relaunch } = await import('@tauri-apps/plugin-process');
      await relaunch();
    },
  },
  updater: {
    check: async () => {
      const { check } = await import('@tauri-apps/plugin-updater');
      return check();
    },
  },
  invoke: async (command, args) => {
    const { invoke } = await import('@tauri-apps/api/core');
    return invoke(command, args);
  },
};
