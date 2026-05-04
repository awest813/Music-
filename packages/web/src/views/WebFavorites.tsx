import { useNavigate } from '@tanstack/react-router';
import { Disc3, Music, User } from 'lucide-react';
import { useMemo, type FC } from 'react';

import { useTranslation } from '@nuclearplayer/i18n';
import { pickArtwork } from '@nuclearplayer/model';
import { Card, CardGrid, EmptyState, ViewShell } from '@nuclearplayer/ui';

import { ConnectedTrackTable } from '../components/ConnectedTrackTable';
import { useActiveProvider } from '../hooks/useActiveProvider';
import { useFavoritesStore } from '../stores/favoritesStore';
import { sortByAddedAtDesc } from '../utils/sort';

export const FavoriteAlbums: FC = () => {
  const { t } = useTranslation('favorites');
  const navigate = useNavigate();
  const provider = useActiveProvider('metadata');
  const albums = useFavoritesStore((state) => state.albums);
  const sortedAlbums = useMemo(() => sortByAddedAtDesc(albums), [albums]);

  return (
    <ViewShell data-testid="favorite-albums-view" title={t('albums.title')}>
      {sortedAlbums.length === 0 ? (
        <EmptyState
          icon={<Disc3 size={48} />}
          title={t('albums.empty')}
          description={t('albums.emptyDescription')}
          className="flex-1"
        />
      ) : (
        <CardGrid>
          {sortedAlbums.map((entry) => (
            <Card
              key={`${entry.ref.source.provider}-${entry.ref.source.id}`}
              title={entry.ref.title}
              src={pickArtwork(entry.ref.artwork, 'cover', 300)?.url}
              onClick={
                provider
                  ? () =>
                      navigate({
                        to: `/album/${provider.id}/${entry.ref.source.id}`,
                      })
                  : undefined
              }
            />
          ))}
        </CardGrid>
      )}
    </ViewShell>
  );
};

export const FavoriteArtists: FC = () => {
  const { t } = useTranslation('favorites');
  const navigate = useNavigate();
  const provider = useActiveProvider('metadata');
  const artists = useFavoritesStore((state) => state.artists);
  const sortedArtists = useMemo(() => sortByAddedAtDesc(artists), [artists]);

  return (
    <ViewShell data-testid="favorite-artists-view" title={t('artists.title')}>
      {sortedArtists.length === 0 ? (
        <EmptyState
          icon={<User size={48} />}
          title={t('artists.empty')}
          description={t('artists.emptyDescription')}
          className="flex-1"
        />
      ) : (
        <CardGrid>
          {sortedArtists.map((entry) => (
            <Card
              key={`${entry.ref.source.provider}-${entry.ref.source.id}`}
              title={entry.ref.name}
              src={pickArtwork(entry.ref.artwork, 'cover', 300)?.url}
              onClick={
                provider
                  ? () =>
                      navigate({
                        to: `/artist/${provider.id}/${entry.ref.source.id}`,
                      })
                  : undefined
              }
            />
          ))}
        </CardGrid>
      )}
    </ViewShell>
  );
};

export const FavoriteTracks: FC = () => {
  const { t } = useTranslation('favorites');
  const favorites = useFavoritesStore((state) => state.tracks);
  const sortedTracks = useMemo(
    () => sortByAddedAtDesc(favorites).map((entry) => entry.ref),
    [favorites],
  );
  const hasDuration = sortedTracks.some((track) => track.durationMs != null);

  return (
    <ViewShell data-testid="favorite-tracks-view" title={t('tracks.title')}>
      {sortedTracks.length === 0 ? (
        <EmptyState
          icon={<Music size={48} />}
          title={t('tracks.empty')}
          description={t('tracks.emptyDescription')}
          className="flex-1"
        />
      ) : (
        <ConnectedTrackTable
          tracks={sortedTracks}
          features={{
            header: true,
            filterable: true,
            sortable: true,
            playAll: true,
            addAllToQueue: true,
          }}
          display={{
            displayThumbnail: true,
            displayArtist: true,
            displayDuration: hasDuration,
            displayQueueControls: true,
          }}
        />
      )}
    </ViewShell>
  );
};
