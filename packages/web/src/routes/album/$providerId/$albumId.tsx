import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';

import { WebAlbum } from '../../../views/WebAlbum';

export const Route = createFileRoute('/album/$providerId/$albumId')({
  params: {
    parse: (params) => ({
      providerId: z.string().parse(params.providerId),
      albumId: z.string().parse(params.albumId),
    }),
    stringify: ({ providerId, albumId }) => ({
      providerId,
      albumId,
    }),
  },
  component: WebAlbum,
});
