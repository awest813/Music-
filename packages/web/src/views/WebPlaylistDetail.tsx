import { useNavigate, useParams } from '@tanstack/react-router';
import isEmpty from 'lodash-es/isEmpty';
import {
  ArrowLeft,
  DownloadIcon,
  ListMusicIcon,
  TrashIcon,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, type FC } from 'react';
import { toast } from 'sonner';

import { useTranslation } from '@nuclearplayer/i18n';
import type { PlaylistItem, Track } from '@nuclearplayer/model';
import {
  Button,
  EmptyState,
  ScrollableArea,
  ViewShell,
} from '@nuclearplayer/ui';

import { ConnectedTrackTable } from '../components/ConnectedTrackTable';
import { usePlaylistExport } from '../hooks/usePlaylistExport';
import { useQueueActions } from '../hooks/useQueueActions';
import { usePlaylistStore } from '../stores/playlistStore';

const EMPTY_ITEMS: PlaylistItem[] = [];

const usePlaylistDetail = () => {
  const { playlistId } = useParams({ from: '/playlists/$playlistId' });
  const loadPlaylist = usePlaylistStore((state) => state.loadPlaylist);
  const playlist = usePlaylistStore((state) => state.playlists.get(playlistId));

  useEffect(() => {
    void loadPlaylist(playlistId);
  }, [playlistId, loadPlaylist]);

  const items = playlist?.items ?? EMPTY_ITEMS;
  const tracks = useMemo(() => items.map((item) => item.track), [items]);

  return { playlistId, playlist, items, tracks };
};

export const WebPlaylistDetail: FC = () => {
  const { t } = useTranslation(['playlists', 'common']);
  const navigate = useNavigate();
  const { playlistId, playlist, items, tracks } = usePlaylistDetail();
  const removeTracks = usePlaylistStore((state) => state.removeTracks);
  const reorderTracks = usePlaylistStore((state) => state.reorderTracks);
  const deletePlaylist = usePlaylistStore((state) => state.deletePlaylist);
  const { clearQueue, addToQueue } = useQueueActions();
  const { exportPlaylist } = usePlaylistExport();
  const isEditable = Boolean(playlist && !playlist.isReadOnly);

  const handleRemove = useCallback(
    (_track: Track, index: number) => {
      const item = items[index];
      if (item) {
        void removeTracks(playlistId, [item.id]);
      }
    },
    [items, playlistId, removeTracks],
  );

  const handleReorder = useCallback(
    (from: number, to: number) => {
      void reorderTracks(playlistId, from, to);
    },
    [playlistId, reorderTracks],
  );

  const handleDelete = useCallback(async () => {
    try {
      await deletePlaylist(playlistId);
      toast.success(t('playlists:deleteSuccess'));
      navigate({ to: '/playlists' });
    } catch (error) {
      toast.error(
        t('playlists:deleteError', {
          message: error instanceof Error ? error.message : String(error),
        }),
      );
    }
  }, [playlistId, deletePlaylist, navigate, t]);

  const handleExport = useCallback(() => {
    if (playlist) {
      exportPlaylist(playlist);
    }
  }, [playlist, exportPlaylist]);

  const getItemId = useCallback(
    (_track: Track, index: number) => items[index]?.id ?? String(index),
    [items],
  );

  const hasDuration = tracks.some((track) => track.durationMs != null);

  return (
    <ViewShell
      data-testid="playlist-detail-view"
      title={playlist?.name ?? t('common:actions.loading')}
    >
      <div className="mb-4 flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate({ to: '/playlists' })}
          aria-label={t('common:actions.back')}
        >
          <ArrowLeft size={16} />
        </Button>
        {!isEmpty(tracks) && (
          <>
            <Button
              onClick={() => {
                clearQueue();
                addToQueue(tracks);
              }}
            >
              {t('playlists:play')}
            </Button>
            <Button variant="secondary" onClick={() => addToQueue(tracks)}>
              {t('playlists:addToQueue')}
            </Button>
          </>
        )}
        <div className="flex-1" />
        {playlist && !playlist.isReadOnly && (
          <>
            <Button
              variant="secondary"
              size="icon"
              onClick={handleExport}
              title={t('playlists:exportPlaylist')}
              data-testid="export-playlist-button"
            >
              <DownloadIcon size={16} />
            </Button>
            <Button
              variant="secondary"
              size="icon"
              onClick={handleDelete}
              title={t('playlists:deletePlaylist')}
              data-testid="delete-playlist-button"
            >
              <TrashIcon size={16} />
            </Button>
          </>
        )}
      </div>

      {isEmpty(tracks) ? (
        <EmptyState
          icon={<ListMusicIcon size={48} />}
          title={t('emptyTracks')}
          description={t('emptyTracksDescription')}
          className="flex-1"
        />
      ) : (
        <ScrollableArea className="flex-1 overflow-hidden">
          <ConnectedTrackTable
            tracks={tracks}
            getItemId={isEditable ? getItemId : undefined}
            features={{
              header: true,
              reorderable: isEditable,
              playAll: true,
              addAllToQueue: true,
            }}
            display={{
              displayThumbnail: true,
              displayArtist: true,
              displayDuration: hasDuration,
              displayQueueControls: true,
              displayDeleteButton: isEditable,
            }}
            actions={
              isEditable
                ? { onRemove: handleRemove, onReorder: handleReorder }
                : undefined
            }
          />
        </ScrollableArea>
      )}
    </ViewShell>
  );
};
