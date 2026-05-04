export type PlatformLogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error';

export type PlatformDirectory = 'appData' | 'document' | 'download';

export type PlatformFileEntry = {
  name: string;
  isDirectory: boolean;
};

export type PlatformWatchEvent = {
  paths: string[];
};

export type PlatformWatchOptions = {
  baseDir?: PlatformDirectory;
};

export type PlatformFileOptions = {
  baseDir?: PlatformDirectory;
};

export type PlatformStorageStore = {
  get<T>(key: string): Promise<T | undefined>;
  set(key: string, value: unknown): Promise<void>;
  delete(key: string): Promise<void>;
  clear(): Promise<void>;
  entries(): Promise<[string, unknown][]>;
  save(): Promise<void>;
  close(): Promise<void>;
};

export type PlatformStorage = {
  createStore(path: string): PlatformStorageStore;
};

export type PlatformFileSystem = {
  readTextFile(path: string, options?: PlatformFileOptions): Promise<string>;
  writeTextFile(
    path: string,
    contents: string,
    options?: PlatformFileOptions,
  ): Promise<void>;
  readDir(
    path: string,
    options?: PlatformFileOptions,
  ): Promise<PlatformFileEntry[]>;
  remove(path: string, options?: PlatformFileOptions): Promise<void>;
  mkdir(path: string, options?: PlatformFileOptions): Promise<void>;
  exists(path: string, options?: PlatformFileOptions): Promise<boolean>;
  watchImmediate(
    path: string,
    handler: (event: PlatformWatchEvent) => void | Promise<void>,
    options?: PlatformWatchOptions,
  ): Promise<() => void>;
  pickTextFile(): Promise<{ name: string; contents: string } | null>;
  saveTextFile(defaultPath: string, contents: string): Promise<string | null>;
  join(...paths: string[]): Promise<string>;
  appDataDir(): Promise<string>;
};

export type PlatformDialog = {
  open(options?: unknown): Promise<string | string[] | null>;
  save(options?: unknown): Promise<string | null>;
  message(message: string, options?: unknown): Promise<void>;
};

export type PlatformShell = {
  openUrl(url: string): Promise<void>;
  revealItemInDir(path: string): Promise<void>;
};

export type PlatformLogger = Record<
  PlatformLogLevel,
  (message: string) => Promise<void>
>;

export type PlatformProcess = {
  exit(code?: number): Promise<void>;
  relaunch(): Promise<void>;
};

export type PlatformUpdater = {
  check(): Promise<unknown>;
};

export type PlatformCapabilities = {
  discord: boolean;
  filesystemWatch: boolean;
  nativeUpdater: boolean;
  nativeDialogs: boolean;
};

export type Platform = {
  capabilities: PlatformCapabilities;
  storage: PlatformStorage;
  fs: PlatformFileSystem;
  dialog: PlatformDialog;
  shell: PlatformShell;
  logger: PlatformLogger;
  process: PlatformProcess;
  updater: PlatformUpdater;
  invoke<T = unknown>(
    command: string,
    args?: Record<string, unknown>,
  ): Promise<T>;
};
