import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';

import { WebPlaylistImport } from '../../../views/WebPlaylistImport/WebPlaylistImport';

export const Route = createFileRoute('/playlists/import/$providerId')({
  component: WebPlaylistImport,
  validateSearch: z.object({
    url: z.string(),
  }),
});
