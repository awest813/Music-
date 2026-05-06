import { create } from 'zustand';

import {
  clearAdvancedTheme,
  DEFAULT_THEME_ID,
  setThemeId,
} from '@nuclearplayer/themes';

import { setSetting, useSettingsStore } from './settingsStore';

export type BasicTheme = { type: 'basic'; id: string };
export type AdvancedTheme = { type: 'advanced'; path: string };

export type ActiveTheme = BasicTheme | AdvancedTheme;

const activeThemeId = (theme: ActiveTheme): string =>
  theme.type === 'advanced' ? theme.path : theme.id;

const persistActiveTheme = async (theme: ActiveTheme) => {
  await setSetting('core.theme.active.type', theme.type);
  await setSetting('core.theme.active.id', activeThemeId(theme));
};

type ThemeStoreState = {
  activeTheme: ActiveTheme;

  selectBasicTheme: (id: string) => Promise<void>;
  selectAdvancedTheme: (path: string) => Promise<void>;
  isSelected: (theme: ActiveTheme) => boolean;
  isBasicThemeSelected: () => boolean;
  isAdvancedThemeSelected: () => boolean;
  hydrate: () => void;
};

export const useThemeStore = create<ThemeStoreState>((set, get) => ({
  activeTheme: { type: 'basic', id: DEFAULT_THEME_ID },

  selectBasicTheme: async (id) => {
    clearAdvancedTheme();
    setThemeId(id);
    const theme: BasicTheme = { type: 'basic', id };
    set({ activeTheme: theme });
    await persistActiveTheme(theme);
  },

  selectAdvancedTheme: async (path) => {
    const theme: AdvancedTheme = { type: 'advanced', path };
    set({ activeTheme: theme });
    await persistActiveTheme(theme);
  },

  isSelected: (theme) => {
    const { activeTheme } = get();
    return (
      activeTheme.type === theme.type &&
      activeThemeId(activeTheme) === activeThemeId(theme)
    );
  },

  isBasicThemeSelected: () => get().activeTheme.type === 'basic',
  isAdvancedThemeSelected: () => get().activeTheme.type === 'advanced',

  hydrate: () => {
    const type = useSettingsStore
      .getState()
      .getValue('core.theme.active.type') as string;
    const id = useSettingsStore
      .getState()
      .getValue('core.theme.active.id') as string;

    if (type === 'basic' && id) {
      set({ activeTheme: { type: 'basic', id } });
      setThemeId(id);
    } else if (type === 'advanced' && id) {
      set({ activeTheme: { type: 'advanced', path: id } });
    }
  },
}));

export const hydrateThemeStore = (): void => {
  useThemeStore.getState().hydrate();
};
