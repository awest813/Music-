import { setPlatform } from '@nuclearplayer/platform';
import { webPlatform } from '@nuclearplayer/platform/web';

setPlatform(webPlatform);

export const platform = webPlatform;
