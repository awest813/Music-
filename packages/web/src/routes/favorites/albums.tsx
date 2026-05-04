import { createFileRoute } from '@tanstack/react-router';

import { FavoriteAlbums } from '../../views/WebFavorites';

export const Route = createFileRoute('/favorites/albums')({
  component: FavoriteAlbums,
});
