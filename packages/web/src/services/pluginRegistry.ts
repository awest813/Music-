import { z } from 'zod';

import { platform } from '../platform';
import { Logger } from './logger';

const REGISTRY_FILE = 'plugins.json';
const PREFIX = 'plugins.';
const store = platform.storage.createStore(REGISTRY_FILE);

export type PluginInstallationMethod = 'dev' | 'store' | 'local';

const PluginRegistryEntrySchema = z.object({
  id: z.string().min(1),
  version: z.string().min(1),
  path: z.string().min(1),
  installationMethod: z.enum(['dev', 'store', 'local']),
  originalPath: z.string().optional(),
  enabled: z.boolean(),
  installedAt: z.string().min(1),
  lastUpdatedAt: z.string().min(1),
  warnings: z.array(z.string()).optional(),
});

export type PluginRegistryEntry = z.infer<typeof PluginRegistryEntrySchema>;

const keyFor = (id: string): string => `${PREFIX}${id}`;

const parseRegistryEntry = (data: unknown): PluginRegistryEntry | undefined => {
  const result = PluginRegistryEntrySchema.safeParse(data);
  if (!result.success) {
    return undefined;
  }
  return result.data;
};

export const listRegistryEntries = async (): Promise<PluginRegistryEntry[]> => {
  const entries = await store.entries();
  const res: PluginRegistryEntry[] = [];
  Array.from(entries).forEach(([key, value]) => {
    if (String(key).startsWith(PREFIX)) {
      const parsed = parseRegistryEntry(value);
      if (parsed) {
        res.push(parsed);
      }
    }
  });
  return res;
};

export const getRegistryEntry = async (
  id: string,
): Promise<PluginRegistryEntry | undefined> => {
  const value = await store.get<unknown>(keyFor(id));
  return parseRegistryEntry(value);
};

export const upsertRegistryEntry = async (
  entry: PluginRegistryEntry,
): Promise<void> => {
  Logger.plugins.debug(
    `Upserting registry entry for ${entry.id}@${entry.version}`,
  );
  await store.set(keyFor(entry.id), entry);
  await store.save();
};

export const setRegistryEntryEnabled = async (
  id: string,
  enabled: boolean,
): Promise<void> => {
  const current = await getRegistryEntry(id);
  if (!current) {
    Logger.plugins.warn(
      `Cannot set enabled=${enabled} for ${id}: not found in registry`,
    );
    return;
  }
  await upsertRegistryEntry({ ...current, enabled });
};

export const setRegistryEntryWarnings = async (
  id: string,
  warnings: string[],
): Promise<void> => {
  const current = await getRegistryEntry(id);
  if (!current) {
    return;
  }
  await upsertRegistryEntry({
    ...current,
    warnings: warnings.length ? warnings : undefined,
  });
};

export const removeRegistryEntry = async (id: string): Promise<void> => {
  Logger.plugins.debug(`Removing registry entry for ${id}`);
  await store.delete(keyFor(id));
  await store.save();
};
