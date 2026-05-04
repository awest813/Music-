import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';

import { WebArtist } from '../../../views/WebArtist';

export const Route = createFileRoute('/artist/$providerId/$artistId')({
  params: {
    parse: (params) => ({
      providerId: z.string().parse(params.providerId),
      artistId: z.string().parse(params.artistId),
    }),
    stringify: ({ providerId, artistId }) => ({
      providerId,
      artistId,
    }),
  },
  component: WebArtist,
});
