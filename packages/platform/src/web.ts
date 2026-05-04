import { DEFAULT_NUCLEAR_SERVER_URL } from './constants';
import type { Platform, PlatformStorageStore } from './types';

const DB_NAME = 'nuclear-web-platform';
const DB_VERSION = 1;
const STORE_NAME = 'stores';
const SERVER_URL =
  import.meta.env.VITE_NUCLEAR_SERVER_URL ?? DEFAULT_NUCLEAR_SERVER_URL;

const openDatabase = (): Promise<IDBDatabase> =>
  new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      request.result.createObjectStore(STORE_NAME);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

const withStore = async <T>(
  mode: IDBTransactionMode,
  operation: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> => {
  const database = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, mode);
    const request = operation(transaction.objectStore(STORE_NAME));
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    transaction.oncomplete = () => database.close();
    transaction.onerror = () => reject(transaction.error);
  });
};

const scopedKey = (path: string, key: string): string => `${path}:${key}`;

const createWebStorageStore = (path: string): PlatformStorageStore => ({
  get: (key) =>
    withStore('readonly', (store) => store.get(scopedKey(path, key))),
  set: (key, value) =>
    withStore('readwrite', (store) =>
      store.put(value, scopedKey(path, key)),
    ).then(() => undefined),
  delete: (key) =>
    withStore('readwrite', (store) => store.delete(scopedKey(path, key))).then(
      () => undefined,
    ),
  clear: async () => {
    const entries = await createWebStorageStore(path).entries();
    await Promise.all(
      entries.map(([key]) =>
        withStore('readwrite', (store) => store.delete(scopedKey(path, key))),
      ),
    );
  },
  entries: async () => {
    const database = await openDatabase();
    return new Promise<[string, unknown][]>((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, 'readonly');
      const request = transaction.objectStore(STORE_NAME).openCursor();
      const prefix = `${path}:`;
      const entries: [string, unknown][] = [];
      request.onsuccess = () => {
        const cursor = request.result;
        if (!cursor) {
          resolve(entries);
          return;
        }
        const key = String(cursor.key);
        if (key.startsWith(prefix)) {
          entries.push([key.slice(prefix.length), cursor.value]);
        }
        cursor.continue();
      };
      request.onerror = () => reject(request.error);
      transaction.oncomplete = () => database.close();
      transaction.onerror = () => reject(transaction.error);
    });
  },
  save: async () => {},
  close: async () => {},
});

const selectTextFile = (): Promise<{ name: string; contents: string } | null> =>
  new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,.m3u,.m3u8,.txt,application/json,text/plain';
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) {
        resolve(null);
        return;
      }
      file.text().then((contents) => resolve({ name: file.name, contents }));
    };
    input.click();
  });

const downloadTextFile = async (
  defaultPath: string,
  contents: string,
): Promise<string> => {
  const blob = new Blob([contents], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = defaultPath.split('/').at(-1) ?? defaultPath;
  anchor.click();
  URL.revokeObjectURL(url);
  return defaultPath;
};

export const webPlatform: Platform = {
  capabilities: {
    discord: false,
    filesystemWatch: false,
    nativeDialogs: false,
    nativeUpdater: false,
  },
  storage: {
    createStore: createWebStorageStore,
  },
  fs: {
    readTextFile: async () => {
      throw new Error('Direct file reads are not available in the web runtime');
    },
    writeTextFile: async (path, contents) => {
      await downloadTextFile(path, contents);
    },
    readDir: async () => [],
    remove: async () => {},
    mkdir: async () => {},
    exists: async () => false,
    watchImmediate: async () => () => {},
    pickTextFile: selectTextFile,
    saveTextFile: downloadTextFile,
    join: async (...paths) => paths.filter(Boolean).join('/'),
    appDataDir: async () => 'nuclear-web',
  },
  dialog: {
    open: async () => null,
    save: async () => null,
    message: async (message) => window.alert(message),
  },
  shell: {
    openUrl: async (url) => {
      window.open(url, '_blank', 'noopener,noreferrer');
    },
    revealItemInDir: async () => {},
  },
  logger: {
    trace: async (message) => console.trace(message),
    debug: async (message) => console.debug(message),
    info: async (message) => console.info(message),
    warn: async (message) => console.warn(message),
    error: async (message) => console.error(message),
  },
  process: {
    exit: async () => {},
    relaunch: async () => window.location.reload(),
  },
  updater: {
    check: async () => null,
  },
  invoke: async (command, args) => {
    const response = await fetch(`${SERVER_URL}/invoke/${command}`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify(args ?? {}),
    });
    if (!response.ok) {
      throw new Error(`Platform command failed: ${command}`);
    }
    return response.json();
  },
};
