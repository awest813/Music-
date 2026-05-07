import { useParams, useSearch } from '@tanstack/react-router';
import { useCallback, useMemo, type FC } from 'react';

import { pickArtwork, type Playlist } from '@nuclearplayer/model';
import {
  Loader,
  MOSAIC_SIZE,
  ScrollableArea,
  ViewShell,
} from '@nuclearplayer/ui';

import { ConnectedTrackTable } from '../../components/ConnectedTrackTable';
import { PlaylistDetailHeader } from '../WebPlaylistDetail/PlaylistDetailHeader';
import { PlaylistImportActions } from './PlaylistImportActions';
import { usePlaylistFromProvider } from './usePlaylistFromProvider';
import { useSaveLocally } from './useSaveLocally';

export const WebPlaylistImport: FC = () => {
  const { providerId } = useParams({
    from: '/playlists/import/$providerId',
  });
  const { url } = useSearch({ from: '/playlists/import/$providerId' });

  const { playlist, items, tracks, isLoading } = usePlaylistFromProvider(
    providerId,
    url,
  );
  const { saveLocally } = useSaveLocally(playlist);

  const thumbnails = useMemo(
    () => (playlist ? buildThumbnails(playlist) : []),
    [playlist],
  );

  const getItemId = useCallback(
    (_track: unknown, index: number) => items[index]?.id ?? String(index),
    [items],
  );

  if (isLoading) {
    return (
      <ViewShell data-testid="playlist-import-view" title="Importing...">
        <div className="flex flex-1 items-center justify-center">
          <Loader size="xl" />
        </div>
      </ViewShell>
    );
  }

  return (
    <ScrollableArea
      className="bg-background"
      data-testid="playlist-import-view"
    >
      {playlist && (
        <PlaylistDetailHeader
          playlist={playlist}
          thumbnails={thumbnails}
          className="mx-6 mt-6"
        >
          <PlaylistImportActions tracks={tracks} onSaveLocally={saveLocally} />
        </PlaylistDetailHeader>
      )}
      {tracks.length > 0 && (
        <div className="p-6">
          <ConnectedTrackTable
            tracks={tracks}
            getItemId={getItemId}
            features={{ header: true, reorderable: false }}
            display={{
              displayThumbnail: true,
              displayArtist: true,
              displayDuration: tracks.some((track) => track.durationMs != null),
              displayQueueControls: true,
              displayDeleteButton: false,
            }}
          />
        </div>
      )}
    </ScrollableArea>
  );
};

function buildThumbnails(playlist: Playlist): string[] {
  const customUrl = pickArtwork(playlist.artwork, 'cover', 300)?.url;
  if (customUrl) {
    return [customUrl];
  }
  const urls: string[] = [];
  for (const item of playlist.items) {
    const itemUrl = pickArtwork(item.track.artwork, 'cover', 300)?.url;
    if (itemUrl && !urls.includes(itemUrl)) {
      urls.push(itemUrl);
    }
    if (urls.length >= MOSAIC_SIZE) {
      break;
    }
  }
  if (urls.length === 0) {
    const firstUrl = pickArtwork(
      playlist.items[0]?.track.artwork,
      'cover',
      300,
    )?.url;
    return firstUrl ? [firstUrl] : [];
  }
  return urls;
}
