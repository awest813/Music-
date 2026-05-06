import { save } from '@tauri-apps/plugin-dialog';
import { writeTextFile } from '@tauri-apps/plugin-fs';
import { useCallback } from 'react';
import { toast } from 'sonner';

import { useTranslation } from '@nuclearplayer/i18n';
import { PLAYLIST_EXPORT_VERSION } from '@nuclearplayer/model';

import { usePlaylistStore } from '../stores/playlistStore';
import { reportError } from '../utils/logging';

export const usePlaylistExport = (playlistId: string) => {
  const playlist = usePlaylistStore((state) => state.playlists.get(playlistId));
  const loadPlaylist = usePlaylistStore((state) => state.loadPlaylist);
  const { t } = useTranslation('playlists');

  const exportAsJson = useCallback(async () => {
    try {
      const currentPlaylist = playlist ?? (await loadPlaylist(playlistId));
      if (!currentPlaylist) {
        toast.error(t('exportError'));
        return;
      }

      const filePath = await save({
        defaultPath: `${currentPlaylist.name}.json`,
        filters: [{ name: 'JSON Files', extensions: ['json'] }],
      });

      if (!filePath) {
        return;
      }

      const exportData = {
        version: PLAYLIST_EXPORT_VERSION,
        playlist: currentPlaylist,
      };
      await writeTextFile(filePath, JSON.stringify(exportData, null, 2));
      toast.success(t('exportSuccess'));
    } catch (error) {
      await reportError('playlists', {
        userMessage: t('exportError'),
        error,
      });
    }
  }, [playlist, loadPlaylist, playlistId, t]);

  return { exportAsJson };
};
