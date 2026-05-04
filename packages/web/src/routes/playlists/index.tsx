import { createFileRoute } from '@tanstack/react-router';

import { WebPlaylists } from '../../views/WebPlaylists';

export const Route = createFileRoute('/playlists/')({
  component: WebPlaylists,
});
