import type {
  SettingDefinition,
  SettingsHost,
  SettingSource,
  SettingValue,
} from '@nuclearplayer/plugin-sdk';

import { useSettingsStore } from '../stores/settingsStore';

const normalizeId = (source: SettingSource, id: string): string => {
  if (source.type === 'plugin') {
    return `plugin.${source.pluginId}.${id}`;
  }
  return `core.${id}`;
};

const createSettingsHost = (source: SettingSource): SettingsHost => ({
  register: async (definitions: SettingDefinition[]) => {
    const registeredIds = useSettingsStore
      .getState()
      .register(definitions, source);
    return { registered: registeredIds };
  },
  get: async <T extends SettingValue = SettingValue>(id: string) => {
    const fullyQualifiedId = normalizeId(source, id);
    const currentValue = useSettingsStore.getState().getValue(fullyQualifiedId);
    return currentValue as T | undefined;
  },
  set: async (id: string, value: SettingValue) => {
    const fullyQualifiedId = normalizeId(source, id);
    await useSettingsStore.getState().setValue(fullyQualifiedId, value);
  },
  subscribe: <T extends SettingValue = SettingValue>(
    id: string,
    listener: (value: T | undefined) => void,
  ) => {
    const fullyQualifiedId = normalizeId(source, id);
    let previousValue = useSettingsStore
      .getState()
      .getValue(fullyQualifiedId) as T | undefined;
    const unsubscribe = useSettingsStore.subscribe((state) => {
      const nextValue = state.getValue(fullyQualifiedId) as T | undefined;
      if (nextValue !== previousValue) {
        previousValue = nextValue;
        listener(nextValue);
      }
    });
    return unsubscribe;
  },
});

export const createPluginSettingsHost = (
  pluginId: string,
  pluginName?: string,
): SettingsHost => createSettingsHost({ type: 'plugin', pluginId, pluginName });

export const coreSettingsHost: SettingsHost = createSettingsHost({
  type: 'core',
});
