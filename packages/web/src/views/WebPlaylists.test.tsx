import { beforeEach, describe, expect, it, vi } from 'vitest';

import { WebPlaylistsWrapper } from './WebPlaylists.test-wrapper';

vi.mock('@tanstack/react-router', () => ({
  useNavigate: vi.fn(() => vi.fn()),
}));

const mockPlaylistStore = {
  index: [],
  createPlaylist: vi.fn(async () => 'new-playlist-id'),
  importPlaylist: vi.fn(async () => {}),
  setState: vi.fn(),
};

vi.mock('../stores/playlistStore', () => ({
  usePlaylistStore: Object.assign(
    vi.fn((selector) =>
      selector ? selector(mockPlaylistStore) : mockPlaylistStore,
    ),
    {
      setState: vi.fn((state) => {
        Object.assign(mockPlaylistStore, state);
      }),
      getState: vi.fn(() => mockPlaylistStore),
    },
  ),
}));

describe('WebPlaylists', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPlaylistStore.index = [];
  });

  it('shows empty state when no playlists exist', async () => {
    await WebPlaylistsWrapper.mount();
    expect(WebPlaylistsWrapper.emptyState).toBeInTheDocument();
  });

  it('shows create, import, and import URL buttons', async () => {
    await WebPlaylistsWrapper.mount();
    expect(WebPlaylistsWrapper.createButton).toBeInTheDocument();
    expect(WebPlaylistsWrapper.importButton).toBeInTheDocument();
    expect(WebPlaylistsWrapper.importUrlButton).toBeInTheDocument();
  });

  it('shows playlist cards when playlists exist', async () => {
    mockPlaylistStore.index = [
      WebPlaylistsWrapper.fixtures.playlist('p1', 'My Playlist', 5),
      WebPlaylistsWrapper.fixtures.playlist('p2', 'Favorites', 12),
    ];

    await WebPlaylistsWrapper.mount();
    expect(WebPlaylistsWrapper.emptyState).not.toBeInTheDocument();
  });
});
