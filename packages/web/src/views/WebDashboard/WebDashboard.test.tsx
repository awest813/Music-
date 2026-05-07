import { beforeEach, describe, expect, it, vi } from 'vitest';

import { WebDashboardWrapper } from './WebDashboard.test-wrapper';

vi.mock('../../services/providersHost', () => {
  const byKind = new Map();
  const byId = new Map();
  const subscribers = new Set();

  return {
    providersHost: {
      register: vi.fn((provider) => {
        const kindMap = byKind.get(provider.kind) ?? new Map();
        kindMap.set(provider.id, provider);
        byKind.set(provider.kind, kindMap);
        byId.set(provider.id, provider);
        subscribers.forEach((listener) => listener());
        return provider.id;
      }),
      list: vi.fn((kind) => {
        if (kind) {
          const map = byKind.get(kind);
          return map ? Array.from(map.values()) : [];
        }
        return [];
      }),
      clear: vi.fn(() => {
        byKind.clear();
        byId.clear();
      }),
      subscribe: vi.fn((listener) => {
        subscribers.add(listener);
        return () => subscribers.delete(listener);
      }),
      resolveActiveOnBootstrap: vi.fn(),
      getActive: vi.fn(),
      setActive: vi.fn(),
      get: vi.fn(),
      unregister: vi.fn(),
    },
  };
});

vi.mock('../../services/dashboardHost', () => ({
  dashboardHost: {
    fetchTopTracks: vi.fn().mockResolvedValue([]),
    fetchTopArtists: vi.fn().mockResolvedValue([]),
    fetchTopAlbums: vi.fn().mockResolvedValue([]),
    fetchEditorialPlaylists: vi.fn().mockResolvedValue([]),
    fetchNewReleases: vi.fn().mockResolvedValue([]),
  },
}));

vi.mock('@tanstack/react-router', () => ({
  useNavigate: vi.fn(() => vi.fn()),
}));

vi.mock('../../hooks/useProviders', () => ({
  useProviders: vi.fn(() => []),
}));

vi.mock('../../hooks/useQueueActions', () => ({
  useQueueActions: vi.fn(() => ({
    clearQueue: vi.fn(),
    addToQueue: vi.fn(),
  })),
}));

vi.mock('../../hooks/useTrackActions', () => ({
  useTrackActions: vi.fn(() => ({
    addToQueue: vi.fn(),
    playNow: vi.fn(),
    addNext: vi.fn(),
    toggleFavorite: vi.fn(),
    isFavorite: vi.fn(() => false),
  })),
}));

const { useProviders } = await import('../../hooks/useProviders');
const { dashboardHost } = await import('../../services/dashboardHost');

describe('WebDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useProviders as ReturnType<typeof vi.fn>).mockReturnValue([]);
  });

  it('shows loading state when no providers are registered', async () => {
    await WebDashboardWrapper.mount();
    expect(WebDashboardWrapper.loader).toBeInTheDocument();
  });

  it('shows empty state when providers have no dashboard capabilities', async () => {
    const provider = WebDashboardWrapper.fixtures.provider([]);
    (useProviders as ReturnType<typeof vi.fn>).mockReturnValue([provider]);

    await WebDashboardWrapper.mount();
    expect(WebDashboardWrapper.emptyState).toBeInTheDocument();
  });

  it('renders top tracks widget when topTracks capability is available', async () => {
    const provider = WebDashboardWrapper.fixtures.provider(['topTracks']);
    const result = WebDashboardWrapper.fixtures.topTracksResult(3);
    (
      dashboardHost.fetchTopTracks as ReturnType<typeof vi.fn>
    ).mockResolvedValue([result]);
    (useProviders as ReturnType<typeof vi.fn>).mockReturnValue([provider]);

    await WebDashboardWrapper.mount();
    expect(WebDashboardWrapper.topTracksWidget).toBeInTheDocument();
  });

  it('renders top artists widget when topArtists capability is available', async () => {
    const provider = WebDashboardWrapper.fixtures.provider(['topArtists']);
    const result = WebDashboardWrapper.fixtures.topArtistsResult(3);
    (
      dashboardHost.fetchTopArtists as ReturnType<typeof vi.fn>
    ).mockResolvedValue([result]);
    (useProviders as ReturnType<typeof vi.fn>).mockReturnValue([provider]);

    await WebDashboardWrapper.mount();
    expect(WebDashboardWrapper.topArtistsWidget).toBeInTheDocument();
  });

  it('renders top albums widget when topAlbums capability is available', async () => {
    const provider = WebDashboardWrapper.fixtures.provider(['topAlbums']);
    const result = WebDashboardWrapper.fixtures.topAlbumsResult(3);
    (
      dashboardHost.fetchTopAlbums as ReturnType<typeof vi.fn>
    ).mockResolvedValue([result]);
    (useProviders as ReturnType<typeof vi.fn>).mockReturnValue([provider]);

    await WebDashboardWrapper.mount();
    expect(WebDashboardWrapper.topAlbumsWidget).toBeInTheDocument();
  });

  it('renders editorial playlists widget when editorialPlaylists capability is available', async () => {
    const provider = WebDashboardWrapper.fixtures.provider([
      'editorialPlaylists',
    ]);
    const result = WebDashboardWrapper.fixtures.editorialPlaylistsResult(3);
    (
      dashboardHost.fetchEditorialPlaylists as ReturnType<typeof vi.fn>
    ).mockResolvedValue([result]);
    (useProviders as ReturnType<typeof vi.fn>).mockReturnValue([provider]);

    await WebDashboardWrapper.mount();
    expect(WebDashboardWrapper.editorialPlaylistsWidget).toBeInTheDocument();
  });

  it('renders new releases widget when newReleases capability is available', async () => {
    const provider = WebDashboardWrapper.fixtures.provider(['newReleases']);
    const result = WebDashboardWrapper.fixtures.newReleasesResult(3);
    (
      dashboardHost.fetchNewReleases as ReturnType<typeof vi.fn>
    ).mockResolvedValue([result]);
    (useProviders as ReturnType<typeof vi.fn>).mockReturnValue([provider]);

    await WebDashboardWrapper.mount();
    expect(WebDashboardWrapper.newReleasesWidget).toBeInTheDocument();
  });

  it('renders multiple widgets when provider has multiple capabilities', async () => {
    const provider = WebDashboardWrapper.fixtures.provider([
      'topTracks',
      'topArtists',
      'newReleases',
    ]);
    const tracksResult = WebDashboardWrapper.fixtures.topTracksResult(3);
    const artistsResult = WebDashboardWrapper.fixtures.topArtistsResult(3);
    const albumsResult = WebDashboardWrapper.fixtures.newReleasesResult(3);

    (
      dashboardHost.fetchTopTracks as ReturnType<typeof vi.fn>
    ).mockResolvedValue([tracksResult]);
    (
      dashboardHost.fetchTopArtists as ReturnType<typeof vi.fn>
    ).mockResolvedValue([artistsResult]);
    (
      dashboardHost.fetchNewReleases as ReturnType<typeof vi.fn>
    ).mockResolvedValue([albumsResult]);
    (useProviders as ReturnType<typeof vi.fn>).mockReturnValue([provider]);

    await WebDashboardWrapper.mount();
    expect(WebDashboardWrapper.topTracksWidget).toBeInTheDocument();
    expect(WebDashboardWrapper.topArtistsWidget).toBeInTheDocument();
    expect(WebDashboardWrapper.newReleasesWidget).toBeInTheDocument();
  });
});
