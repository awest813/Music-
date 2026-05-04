import { useQuery } from '@tanstack/react-query';
import { useParams } from '@tanstack/react-router';
import { FC, useMemo } from 'react';

import { useTranslation } from '@nuclearplayer/i18n';
import { ArtworkSet, pickArtwork, Track, TrackRef } from '@nuclearplayer/model';
import { Loader, ScrollableArea, StatChip } from '@nuclearplayer/ui';

import { ConnectedFavoriteButton } from '../components/ConnectedFavoriteButton';
import { ConnectedTrackTable } from '../components/ConnectedTrackTable';
import { metadataHost } from '../services/metadataHost';

const mapTrackRefs = (refs: TrackRef[], albumArtwork?: ArtworkSet): Track[] =>
  refs.map((ref) => ({
    ...ref,
    artwork: ref.artwork ?? albumArtwork,
    artists: ref.artists.map((artist) => ({ name: artist.name, roles: [] })),
  }));

type AlbumSectionProps = {
  providerId: string;
  albumId: string;
};

const AlbumHeader: FC<AlbumSectionProps> = ({ providerId, albumId }) => {
  const { t } = useTranslation('album');
  const {
    data: album,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['album-details', providerId, albumId],
    queryFn: () => metadataHost.fetchAlbumDetails(albumId, providerId),
    enabled: Boolean(providerId && albumId),
  });

  if (isLoading) {
    return (
      <div className="flex h-100 w-full items-center justify-center">
        <Loader size="xl" data-testid="album-header-loader" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex h-100 w-full flex-col items-center justify-center gap-3 p-6">
        <div className="text-accent-red">{t('errors.failedToLoadDetails')}</div>
      </div>
    );
  }

  if (!album) {
    return null;
  }

  const cover = pickArtwork(album.artwork, 'cover', 600);
  const releaseYear = album.releaseDate
    ? new Date(album.releaseDate.dateIso).getFullYear()
    : undefined;
  const trackCount = album.tracks?.length ?? 0;

  return (
    <div className="border-border bg-primary shadow-shadow relative mx-6 mt-6 flex flex-col gap-6 rounded-md border-(length:--border-width) p-6 md:flex-row">
      <ConnectedFavoriteButton
        type="album"
        source={{ provider: providerId, id: albumId }}
        data={{ title: album.title, artwork: album.artwork }}
        className="bg-background border-border absolute top-4 right-4 z-10 rounded-md border-(length:--border-width)"
        data-testid="album-favorite-button"
      />
      {cover && (
        <img
          src={cover.url}
          alt={album.title}
          className="border-border shadow-shadow h-60 w-60 rounded-md border-(length:--border-width) object-cover select-none"
        />
      )}

      <div className="flex flex-1 flex-col gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="font-heading text-5xl font-extrabold tracking-tight">
            {album.title}
          </h1>
          <div className="text-text-secondary text-lg">
            by {album.artists.map((artist) => artist.name).join(', ')}
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          {album.genres && album.genres.length > 0 && (
            <StatChip value={album.genres.join(', ')} label={t('genre')} />
          )}
          {releaseYear && <StatChip value={releaseYear} label={t('year')} />}
          <StatChip value={trackCount} label={t('tracks')} />
        </div>
      </div>
    </div>
  );
};

const AlbumTrackList: FC<AlbumSectionProps> = ({ providerId, albumId }) => {
  const { t } = useTranslation('album');
  const {
    data: album,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['album-details', providerId, albumId],
    queryFn: () => metadataHost.fetchAlbumDetails(albumId, providerId),
    enabled: Boolean(providerId && albumId),
  });

  const tracks = useMemo(
    () => (album?.tracks ? mapTrackRefs(album.tracks, album.artwork) : []),
    [album?.tracks, album?.artwork],
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader data-testid="album-tracks-loader" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-accent-red p-4">
        {t('errors.failedToLoadTracks')}
      </div>
    );
  }

  if (!album) {
    return null;
  }

  const hasDuration = tracks.some((track) => track.durationMs != null);

  return (
    <ConnectedTrackTable
      tracks={tracks}
      features={{ filterable: false, playAll: true, addAllToQueue: true }}
      display={{ displayDuration: hasDuration, displayThumbnail: false }}
    />
  );
};

export const WebAlbum: FC = () => {
  const { providerId, albumId } = useParams({
    from: '/album/$providerId/$albumId',
  });

  return (
    <ScrollableArea className="bg-background" data-testid="album-view">
      <AlbumHeader providerId={providerId} albumId={albumId} />
      <div className="p-6">
        <AlbumTrackList providerId={providerId} albumId={albumId} />
      </div>
    </ScrollableArea>
  );
};
