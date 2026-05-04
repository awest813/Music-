import { createFileRoute } from '@tanstack/react-router';

import { WebPlaylistDetail } from '../../views/WebPlaylistDetail';

export const Route = createFileRoute('/playlists/$playlistId')({
  component: WebPlaylistDetail,
});
