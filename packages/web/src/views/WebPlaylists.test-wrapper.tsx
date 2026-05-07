import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { FC, ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';

import { i18n } from '@nuclearplayer/i18n';
import type { PlaylistIndexEntry } from '@nuclearplayer/model';

import { usePlaylistStore } from '../stores/playlistStore';
import { WebPlaylists } from './WebPlaylists';

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

const createPlaylistEntry = (
  id: string,
  name: string,
  itemCount = 0,
): PlaylistIndexEntry => ({
  id,
  name,
  itemCount,
  lastModifiedIso: new Date().toISOString(),
  thumbnails: [],
});

export const WebPlaylistsWrapper = {
  async mount(): Promise<void> {
    const queryClient = createQueryClient();
    queryClient.clear();
    render(<WebPlaylists />, {
      wrapper: (props) => <TestWrapper queryClient={queryClient} {...props} />,
    });
  },

  get view() {
    return screen.getByTestId('playlists-view');
  },

  get emptyState() {
    return screen.queryByRole('heading', { name: /no playlists/i });
  },

  get createButton() {
    return screen.getByTestId('create-playlist-button');
  },

  get importButton() {
    return screen.getByTestId('import-playlist-button');
  },

  get importUrlButton() {
    return screen.getByTestId('import-url-button');
  },

  get cards() {
    return screen.queryAllByRole('button', { name: /playlist/i });
  },

  get playlistNameInput() {
    return screen.getByTestId('playlist-name-input');
  },

  createDialog: {
    get isOpen() {
      return screen.queryByRole('dialog') !== null;
    },
    async open() {
      const button = screen.getByTestId('create-playlist-button');
      button.click();
    },
    async close() {
      const cancelButton = screen.queryByRole('button', { name: /cancel/i });
      if (cancelButton) {
        cancelButton.click();
      }
    },
    async submit(name: string) {
      const input = screen.getByTestId('playlist-name-input');
      const event = new Event('input', { bubbles: true });
      (input as HTMLInputElement).value = name;
      input.dispatchEvent(event);
      const submitButton = screen.getByRole('button', { name: /create/i });
      submitButton.click();
    },
  },

  fixtures: {
    playlist(id: string, name: string, itemCount = 5) {
      return createPlaylistEntry(id, name, itemCount);
    },
  },

  async seedPlaylists(entries: PlaylistIndexEntry[]): Promise<void> {
    usePlaylistStore.setState({ index: entries });
  },

  clear(): void {
    usePlaylistStore.setState({ index: [] });
    vi.restoreAllMocks();
  },
};
