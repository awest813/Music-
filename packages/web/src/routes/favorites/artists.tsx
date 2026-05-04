import { createFileRoute } from '@tanstack/react-router';

import { FavoriteArtists } from '../../views/WebFavorites';

export const Route = createFileRoute('/favorites/artists')({
  component: FavoriteArtists,
});
