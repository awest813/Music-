import type { ShellHost } from '@nuclearplayer/plugin-sdk';

import { platform } from './platform';

export const shellHost: ShellHost = {
  async openExternal(url: string) {
    await platform.shell.openUrl(url);
  },
};
