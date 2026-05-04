import type { Playlist } from '@nuclearplayer/model';
import { playlistSchema } from '@nuclearplayer/model';
import type { PlatformStorageStore } from '@nuclearplayer/platform';

import { Logger } from '../logger';
import { platform } from '../platform';
import { loadValidated } from '../validatedStore';

const PLAYLISTS_DIR = 'playlists';
const MAX_CACHED_STORES = 20;

export class PlaylistFileStore {
  #stores = new Map<string, PlatformStorageStore>();
  #accessOrder: string[] = [];

  #get(id: string): PlatformStorageStore {
    let store = this.#stores.get(id);
    if (!store) {
      store = platform.storage.createStore(`${PLAYLISTS_DIR}/${id}.json`);
      this.#stores.set(id, store);
    }
    this.#touch(id);
    return store;
  }

  #touch(id: string): void {
    this.#accessOrder = this.#accessOrder.filter((i) => i !== id);
    this.#accessOrder.push(id);
    void this.#evict();
  }

  async #evict(): Promise<void> {
    while (this.#accessOrder.length > MAX_CACHED_STORES) {
      const evictId = this.#accessOrder.shift();
      if (evictId) {
        const store = this.#stores.get(evictId);
        if (store) {
          this.#stores.delete(evictId);
          await store.close();
        }
      }
    }
  }

  async load(id: string): Promise<Playlist | null> {
    return loadValidated(
      this.#get(id),
      'playlist',
      playlistSchema,
      'playlists',
    );
  }

  async save(playlist: Playlist): Promise<void> {
    const store = this.#get(playlist.id);
    await store.set('playlist', playlist);
    await store.save();
  }

  async delete(id: string): Promise<void> {
    const store = this.#get(id);
    await store.clear();
    await store.save();
    await store.close();
    this.#stores.delete(id);
    this.#accessOrder = this.#accessOrder.filter((i) => i !== id);

    try {
      await platform.fs.remove(`${PLAYLISTS_DIR}/${id}.json`, {
        baseDir: 'appData',
      });
    } catch {
      Logger.playlists.warn(
        `Failed to delete playlist file for id ${id}. It may have already been removed.`,
      );
    }
  }
}
