import type { PlaylistIndexEntry } from '@nuclearplayer/model';
import { playlistIndexSchema } from '@nuclearplayer/model';

import { platform } from '../platform';
import { loadValidated } from '../validatedStore';

const PLAYLISTS_DIR = 'playlists';

export class PlaylistIndexStore {
  #store = platform.storage.createStore(`${PLAYLISTS_DIR}/index.json`);

  async load(): Promise<PlaylistIndexEntry[]> {
    return (
      (await loadValidated(
        this.#store,
        'entries',
        playlistIndexSchema,
        'playlists',
      )) ?? []
    );
  }

  async save(index: PlaylistIndexEntry[]): Promise<void> {
    await this.#store.set('entries', index);
    await this.#store.save();
  }
}
