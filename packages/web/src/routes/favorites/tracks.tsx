import { createFileRoute } from '@tanstack/react-router';

import { FavoriteTracks } from '../../views/WebFavorites';

export const Route = createFileRoute('/favorites/tracks')({
  component: FavoriteTracks,
});
