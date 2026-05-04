import { invoke as tauriInvoke } from '@tauri-apps/api/core';
import { appDataDir, join as tauriJoin } from '@tauri-apps/api/path';
import { message, open, save } from '@tauri-apps/plugin-dialog';
import {
  BaseDirectory,
  exists,
  mkdir,
  readDir,
  readTextFile,
  remove,
  watchImmediate,
  writeTextFile,
} from '@tauri-apps/plugin-fs';
import * as tauriLog from '@tauri-apps/plugin-log';
import { openUrl, revealItemInDir } from '@tauri-apps/plugin-opener';
import { exit, relaunch } from '@tauri-apps/plugin-process';
import { LazyStore } from '@tauri-apps/plugin-store';
import { check } from '@tauri-apps/plugin-updater';

import type {
  Platform,
  PlatformDirectory,
  PlatformFileOptions,
  PlatformWatchOptions,
} from './types';

const toBaseDirectory = (
  directory: PlatformDirectory | undefined,
): BaseDirectory | undefined => {
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

const toFileOptions = (options?: PlatformFileOptions) => ({
  baseDir: toBaseDirectory(options?.baseDir),
});

const toWatchOptions = (options?: PlatformWatchOptions) => ({
  baseDir: toBaseDirectory(options?.baseDir),
});

export const tauriPlatform: Platform = {
  capabilities: {
    discord: true,
    filesystemWatch: true,
    nativeDialogs: true,
    nativeUpdater: true,
  },
  storage: {
    createStore: (path) => new LazyStore(path),
  },
  fs: {
    readTextFile: (path, options) => readTextFile(path, toFileOptions(options)),
    writeTextFile: (path, contents, options) =>
      writeTextFile(path, contents, toFileOptions(options)),
    readDir: async (path, options) => {
      const entries = await readDir(path, toFileOptions(options));
      return entries.map((entry) => ({
        name: entry.name,
        isDirectory: entry.isDirectory,
      }));
    },
    remove: (path, options) => remove(path, toFileOptions(options)),
    mkdir: (path, options) =>
      mkdir(path, { ...toFileOptions(options), recursive: true }),
    exists: (path, options) => exists(path, toFileOptions(options)),
    watchImmediate: async (path, handler, options) =>
      watchImmediate(
        path,
        (event) => {
          void handler({ paths: event.paths });
        },
        toWatchOptions(options),
      ),
    pickTextFile: async () => {
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
      const path = await save({ defaultPath });
      if (!path) {
        return null;
      }
      await writeTextFile(path, contents);
      return path;
    },
    join: (...paths) => tauriJoin(...paths),
    appDataDir,
  },
  dialog: {
    open,
    save,
    message,
  },
  shell: {
    openUrl,
    revealItemInDir,
  },
  logger: {
    trace: tauriLog.trace,
    debug: tauriLog.debug,
    info: tauriLog.info,
    warn: tauriLog.warn,
    error: tauriLog.error,
  },
  process: {
    exit,
    relaunch,
  },
  updater: {
    check,
  },
  invoke: (command, args) => tauriInvoke(command, args),
};
