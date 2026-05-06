import { useCallback } from 'react';

import type { Playlist } from '@nuclearplayer/model';
import { PLAYLIST_EXPORT_VERSION } from '@nuclearplayer/model';

export const usePlaylistExport = () => {
  const exportPlaylist = useCallback((playlist: Playlist) => {
    const exportData = { version: PLAYLIST_EXPORT_VERSION, playlist };
    const json = JSON.stringify(exportData, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${playlist.name.replace(/[^a-z0-9]/gi, '_')}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, []);

  return { exportPlaylist };
};
