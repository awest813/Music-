import type { SettingDefinition } from '@nuclearplayer/plugin-sdk';

import { registerCoreSettings } from '../stores/settingsStore';

const LANGUAGE_OPTIONS = [
  { value: 'en_US', label: 'English' },
  { value: 'de_DE', label: 'Deutsch' },
  { value: 'es_ES', label: 'Español' },
  { value: 'fr_FR', label: 'Français' },
  { value: 'it_IT', label: 'Italiano' },
  { value: 'pt_BR', label: 'Português (Brasil)' },
  { value: 'ru_RU', label: 'Русский' },
];

export const CORE_SETTINGS: SettingDefinition[] = [
  {
    id: 'playback.volume',
    title: 'preferences.playback.volume.title',
    description: 'preferences.playback.volume.description',
    category: 'playback',
    kind: 'number',
    default: 1,
    hidden: true,
    widget: { type: 'slider', min: 0, max: 1, step: 0.01 },
  },
  {
    id: 'playback.muted',
    title: 'preferences.playback.muted.title',
    description: 'preferences.playback.muted.description',
    category: 'playback',
    kind: 'boolean',
    default: false,
    hidden: true,
    widget: { type: 'toggle' },
  },
  {
    id: 'playback.shuffle',
    title: 'preferences.playback.shuffle.title',
    description: 'preferences.playback.shuffle.description',
    category: 'playback',
    kind: 'boolean',
    default: false,
    hidden: true,
    widget: { type: 'toggle' },
  },
  {
    id: 'playback.repeat',
    title: 'preferences.playback.repeat.title',
    description: 'preferences.playback.repeat.description',
    category: 'playback',
    kind: 'string',
    default: 'off',
    hidden: true,
    widget: { type: 'text' },
  },
  {
    id: 'playback.crossfadeMs',
    title: 'preferences.playback.crossfadeMs.title',
    description: 'preferences.playback.crossfadeMs.description',
    category: 'playback',
    kind: 'number',
    default: 0,
    widget: { type: 'number-input', min: 0, max: 5000, step: 50, unit: 'ms' },
  },
  {
    id: 'playback.streamExpiryMs',
    title: 'preferences.playback.streamExpiryMs.title',
    description: 'preferences.playback.streamExpiryMs.description',
    category: 'playback',
    kind: 'number',
    default: 3600000,
    widget: {
      type: 'number-input',
      min: 300000,
      max: 86400000,
      step: 300000,
      unit: 'ms',
    },
  },
  {
    id: 'playback.streamResolutionRetries',
    title: 'preferences.playback.streamResolutionRetries.title',
    description: 'preferences.playback.streamResolutionRetries.description',
    category: 'playback',
    kind: 'number',
    default: 3,
    widget: { type: 'number-input', min: 1, max: 10, step: 1 },
  },
  {
    id: 'general.language',
    title: 'preferences.general.language.title',
    description: 'preferences.general.language.description',
    category: 'general',
    kind: 'enum',
    options: LANGUAGE_OPTIONS,
    default: 'en_US',
    widget: { type: 'select' },
  },
];

export const registerBuiltInCoreSettings = (): void => {
  registerCoreSettings(CORE_SETTINGS);
};
