import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { FC, ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';

import { i18n } from '@nuclearplayer/i18n';
import type {
  AttributedResult,
  DashboardCapability,
  DashboardProvider,
} from '@nuclearplayer/plugin-sdk';

import { dashboardHost } from '../../services/dashboardHost';
import { providersHost } from '../../services/providersHost';
import { WebDashboard } from '../../views/WebDashboard';

const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

const TestWrapper: FC<{ children: ReactNode; queryClient: QueryClient }> = ({
  children,
  queryClient,
}) => (
  <I18nextProvider i18n={i18n}>
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  </I18nextProvider>
);

const createDashboardProvider = (
  capabilities: DashboardCapability[],
): DashboardProvider => ({
  id: 'test-dashboard-provider',
  name: 'Test Dashboard',
  kind: 'dashboard',
  capabilities,
  fetchTopTracks: async () => [],
  fetchTopArtists: async () => [],
  fetchTopAlbums: async () => [],
  fetchEditorialPlaylists: async () => [],
  fetchNewReleases: async () => [],
});

const createTrack = (title: string, id: string) => ({
  title,
  artists: [{ name: 'Test Artist', roles: ['main'] as const }],
  source: { provider: 'test', id },
});

const createArtistRef = (name: string, id: string) => ({
  name,
  source: { provider: 'test', id },
  artwork: { items: [] },
});

const createAlbumRef = (title: string, id: string) => ({
  title,
  artists: [{ name: 'Test Artist', roles: ['main'] as const }],
  source: { provider: 'test', id },
  artwork: { items: [] },
});

const createPlaylistRef = (name: string, id: string) => ({
  name,
  source: { provider: 'test', id },
  artwork: { items: [] },
});

const createAttributedResult = <T,>(
  items: T[],
  providerId = 'test-dashboard-provider',
): AttributedResult<T> => ({
  providerId,
  metadataProviderId: undefined,
  providerName: 'Test Dashboard',
  items,
});

export const WebDashboardWrapper = {
  async mount(): Promise<void> {
    const queryClient = createQueryClient();
    queryClient.clear();
    render(<WebDashboard />, {
      wrapper: (props) => <TestWrapper queryClient={queryClient} {...props} />,
    });
  },

  get view() {
    return screen.getByTestId('dashboard-view');
  },

  get emptyState() {
    return screen.queryByTestId('dashboard-empty-state');
  },

  get loader() {
    return screen.queryByTestId('dashboard-loader');
  },

  get topTracksWidget() {
    return screen.queryByTestId('dashboard-top-tracks');
  },

  get topArtistsWidget() {
    return screen.queryByTestId('dashboard-top-artists');
  },

  get topAlbumsWidget() {
    return screen.queryByTestId('dashboard-top-albums');
  },

  get editorialPlaylistsWidget() {
    return screen.queryByTestId('dashboard-editorial-playlists');
  },

  get newReleasesWidget() {
    return screen.queryByTestId('dashboard-new-releases');
  },

  fixtures: {
    provider(capabilities: DashboardCapability[]) {
      return createDashboardProvider(capabilities);
    },

    topTracksResult(count = 5) {
      return createAttributedResult(
        Array.from({ length: count }, (_, i) =>
          createTrack(`Track ${i + 1}`, `t${i + 1}`),
        ),
      );
    },

    topArtistsResult(count = 5) {
      return createAttributedResult(
        Array.from({ length: count }, (_, i) =>
          createArtistRef(`Artist ${i + 1}`, `a${i + 1}`),
        ),
      );
    },

    topAlbumsResult(count = 5) {
      return createAttributedResult(
        Array.from({ length: count }, (_, i) =>
          createAlbumRef(`Album ${i + 1}`, `al${i + 1}`),
        ),
      );
    },

    editorialPlaylistsResult(count = 5) {
      return createAttributedResult(
        Array.from({ length: count }, (_, i) =>
          createPlaylistRef(`Playlist ${i + 1}`, `p${i + 1}`),
        ),
      );
    },

    newReleasesResult(count = 5) {
      return createAttributedResult(
        Array.from({ length: count }, (_, i) =>
          createAlbumRef(`New Album ${i + 1}`, `na${i + 1}`),
        ),
      );
    },
  },

  async seedProvider(provider: DashboardProvider): Promise<void> {
    providersHost.register(provider);
  },

  async seedDashboardData(
    capability: DashboardCapability,
    result: AttributedResult<unknown>,
  ): Promise<void> {
    const fetchMethod =
      `fetch${capability.charAt(0).toUpperCase() + capability.slice(1)}` as keyof typeof dashboardHost;
    vi.spyOn(dashboardHost, fetchMethod).mockResolvedValue([result]);
  },

  clear(): void {
    providersHost.clear();
    vi.restoreAllMocks();
  },
};
