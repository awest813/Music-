import { v4 as uuidv4 } from 'uuid';
import { create } from 'zustand';

import type {
  Playlist,
  PlaylistIndexEntry,
  PlaylistItem,
  Track,
} from '@nuclearplayer/model';
import {
  pickArtwork,
  playlistIndexSchema,
  playlistSchema,
} from '@nuclearplayer/model';
import { MOSAIC_SIZE } from '@nuclearplayer/ui';

import { platform } from '../platform';
import { useQueueStore } from './queueStore';

const PLAYLISTS_DIR = 'playlists';
const indexStore = platform.storage.createStore(`${PLAYLISTS_DIR}/index.json`);

const getPlaylistStore = (id: string) =>
  platform.storage.createStore(`${PLAYLISTS_DIR}/${id}.json`);

const loadIndex = async (): Promise<PlaylistIndexEntry[]> => {
  const raw = await indexStore.get<unknown>('entries');
  if (raw == null) {
    return [];
  }
  const result = playlistIndexSchema.safeParse(raw);
  return result.success ? result.data : [];
};

const saveIndex = async (index: PlaylistIndexEntry[]): Promise<void> => {
  await indexStore.set('entries', index);
  await indexStore.save();
};

const loadPlaylistById = async (id: string): Promise<Playlist | null> => {
  const store = getPlaylistStore(id);
  const raw = await store.get<unknown>('playlist');
  if (raw == null) {
    return null;
  }
  const result = playlistSchema.safeParse(raw);
  return result.success ? result.data : null;
};

const savePlaylistById = async (playlist: Playlist): Promise<void> => {
  const store = getPlaylistStore(playlist.id);
  await store.set('playlist', playlist);
  await store.save();
};

const getUniqueTrackArtworkUrls = (playlist: Playlist): string[] => {
  const urls = playlist.items
    .map((item) => pickArtwork(item.track.artwork, 'cover', 300)?.url)
    .filter((url): url is string => url !== undefined);
  return [...new Set(urls)];
};

const buildThumbnails = (playlist: Playlist): string[] => {
  const customUrl = pickArtwork(playlist.artwork, 'cover', 300)?.url;
  if (customUrl) {
    return [customUrl];
  }
  const uniqueUrls = getUniqueTrackArtworkUrls(playlist);
  return uniqueUrls.length >= MOSAIC_SIZE
    ? uniqueUrls.slice(0, MOSAIC_SIZE)
    : uniqueUrls.slice(0, 1);
};

const toIndexEntry = (playlist: Playlist): PlaylistIndexEntry => ({
  id: playlist.id,
  name: playlist.name,
  createdAtIso: playlist.createdAtIso,
  lastModifiedIso: playlist.lastModifiedIso,
  isReadOnly: playlist.isReadOnly,
  artwork: playlist.artwork,
  itemCount: playlist.items.length,
  totalDurationMs: playlist.items.reduce(
    (sum, item) => sum + (item.track.durationMs ?? 0),
    0,
  ),
  thumbnails: buildThumbnails(playlist),
});

const upsertInIndex = (
  index: PlaylistIndexEntry[],
  entry: PlaylistIndexEntry,
): PlaylistIndexEntry[] => {
  const existing = index.findIndex((e) => e.id === entry.id);
  if (existing >= 0) {
    const updated = [...index];
    updated[existing] = entry;
    return updated;
  }
  return [...index, entry];
};

type PlaylistStore = {
  index: PlaylistIndexEntry[];
  playlists: Map<string, Playlist>;
  loaded: boolean;

  loadIndex: () => Promise<void>;
  loadPlaylist: (id: string) => Promise<Playlist | null>;
  createPlaylist: (name: string) => Promise<string>;
  deletePlaylist: (id: string) => Promise<void>;
  addTracks: (playlistId: string, tracks: Track[]) => Promise<PlaylistItem[]>;
  removeTracks: (playlistId: string, itemIds: string[]) => Promise<void>;
  importPlaylist: (playlist: Playlist) => Promise<string>;
  reorderTracks: (
    playlistId: string,
    from: number,
    to: number,
  ) => Promise<void>;
  updatePlaylist: (
    id: string,
    updates: Partial<
      Pick<Playlist, 'name' | 'description' | 'tags' | 'artwork'>
    >,
  ) => Promise<void>;
  saveQueueAsPlaylist: (name: string) => Promise<string>;
};

export const usePlaylistStore = create<PlaylistStore>((set, get) => ({
  index: [],
  playlists: new Map(),
  loaded: false,

  loadIndex: async () => {
    const index = await loadIndex();
    set({ index, loaded: true });
  },

  loadPlaylist: async (id: string) => {
    const cached = get().playlists.get(id);
    if (cached) {
      return cached;
    }

    const playlist = await loadPlaylistById(id);
    if (playlist) {
      set((state) => ({
        playlists: new Map(state.playlists).set(id, playlist),
      }));
    }
    return playlist;
  },

  createPlaylist: async (name: string) => {
    const now = new Date().toISOString();
    const playlist: Playlist = {
      id: uuidv4(),
      name,
      createdAtIso: now,
      lastModifiedIso: now,
      isReadOnly: false,
      items: [],
    };

    await savePlaylistById(playlist);
    const index = upsertInIndex(get().index, toIndexEntry(playlist));
    await saveIndex(index);

    set((state) => ({
      playlists: new Map(state.playlists).set(playlist.id, playlist),
      index,
    }));

    return playlist.id;
  },

  importPlaylist: async (playlist: Playlist) => {
    const now = new Date().toISOString();
    const imported: Playlist = {
      ...playlist,
      id: uuidv4(),
      createdAtIso: now,
      lastModifiedIso: now,
      isReadOnly: false,
    };

    await savePlaylistById(imported);
    const index = upsertInIndex(get().index, toIndexEntry(imported));
    await saveIndex(index);

    set((state) => ({
      playlists: new Map(state.playlists).set(imported.id, imported),
      index,
    }));

    return imported.id;
  },

  addTracks: async (playlistId: string, tracks: Track[]) => {
    const playlist = await get().loadPlaylist(playlistId);
    if (!playlist) {
      throw new Error(`Playlist ${playlistId} not found`);
    }

    const now = new Date().toISOString();
    const newItems: PlaylistItem[] = tracks.map((track) => ({
      id: uuidv4(),
      track,
      addedAtIso: now,
    }));

    const updated: Playlist = {
      ...playlist,
      items: [...playlist.items, ...newItems],
      lastModifiedIso: now,
    };

    await savePlaylistById(updated);
    const index = upsertInIndex(get().index, toIndexEntry(updated));
    await saveIndex(index);

    set((state) => ({
      playlists: new Map(state.playlists).set(playlistId, updated),
      index,
    }));

    return newItems;
  },

  removeTracks: async (playlistId: string, itemIds: string[]) => {
    const playlist = await get().loadPlaylist(playlistId);
    if (!playlist) {
      return;
    }

    const idsToRemove = new Set(itemIds);
    const updated: Playlist = {
      ...playlist,
      items: playlist.items.filter((item) => !idsToRemove.has(item.id)),
      lastModifiedIso: new Date().toISOString(),
    };

    await savePlaylistById(updated);
    const index = upsertInIndex(get().index, toIndexEntry(updated));
    await saveIndex(index);

    set((state) => ({
      playlists: new Map(state.playlists).set(playlistId, updated),
      index,
    }));
  },

  reorderTracks: async (playlistId: string, from: number, to: number) => {
    const playlist = await get().loadPlaylist(playlistId);
    if (!playlist) {
      return;
    }

    if (from === to) {
      return;
    }

    const items = [...playlist.items];
    if (from < 0 || from >= items.length || to < 0 || to >= items.length) {
      return;
    }

    const [moved] = items.splice(from, 1);
    items.splice(to, 0, moved);

    const updated: Playlist = {
      ...playlist,
      items,
      lastModifiedIso: new Date().toISOString(),
    };

    set((state) => ({
      playlists: new Map(state.playlists).set(playlistId, updated),
    }));

    await savePlaylistById(updated);
    const index = upsertInIndex(get().index, toIndexEntry(updated));
    await saveIndex(index);
    set({ index });
  },

  updatePlaylist: async (id, updates) => {
    const playlist = await get().loadPlaylist(id);
    if (!playlist) {
      throw new Error(`Playlist ${id} not found`);
    }

    const updated: Playlist = {
      ...playlist,
      ...updates,
      lastModifiedIso: new Date().toISOString(),
    };

    await savePlaylistById(updated);
    const index = upsertInIndex(get().index, toIndexEntry(updated));
    await saveIndex(index);

    set((state) => ({
      playlists: new Map(state.playlists).set(id, updated),
      index,
    }));
  },

  saveQueueAsPlaylist: async (name: string) => {
    const tracks = useQueueStore.getState().items.map((item) => item.track);
    const now = new Date().toISOString();

    const playlist: Playlist = {
      id: uuidv4(),
      name,
      createdAtIso: now,
      lastModifiedIso: now,
      isReadOnly: false,
      items: tracks.map((track) => ({
        id: uuidv4(),
        track,
        addedAtIso: now,
      })),
    };

    await savePlaylistById(playlist);
    const index = upsertInIndex(get().index, toIndexEntry(playlist));
    await saveIndex(index);

    set((state) => ({
      playlists: new Map(state.playlists).set(playlist.id, playlist),
      index,
    }));

    return playlist.id;
  },

  deletePlaylist: async (id: string) => {
    const store = getPlaylistStore(id);
    await store.clear();
    await store.save();

    const index = get().index.filter((entry) => entry.id !== id);
    await saveIndex(index);

    set((state) => {
      const playlists = new Map(state.playlists);
      playlists.delete(id);
      return { playlists, index };
    });
  },
}));

export const initializePlaylistStore = async (): Promise<void> => {
  await usePlaylistStore.getState().loadIndex();
};
