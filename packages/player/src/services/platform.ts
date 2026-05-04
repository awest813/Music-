import { setPlatform } from '@nuclearplayer/platform';
import { tauriPlatform } from '@nuclearplayer/platform/tauri';

setPlatform(tauriPlatform);

export const platform = tauriPlatform;
