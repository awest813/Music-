import { useQuery } from '@tanstack/react-query';
import { useNavigate, useParams } from '@tanstack/react-router';
import isEmpty from 'lodash-es/isEmpty';
import {
  ListMusic,
  LucideIcon,
  MapPin,
  Music,
  UserPlus,
  Users,
} from 'lucide-react';
import { FC, useMemo } from 'react';

import { useTranslation } from '@nuclearplayer/i18n';
import { pickArtwork, Track, TrackRef } from '@nuclearplayer/model';
import type { MetadataProvider } from '@nuclearplayer/plugin-sdk';
import {
  Card,
  CardGrid,
  Loader,
  ScrollableArea,
  StatChip,
} from '@nuclearplayer/ui';

import { ConnectedFavoriteButton } from '../components/ConnectedFavoriteButton';
import { ConnectedTrackTable } from '../components/ConnectedTrackTable';
import { useActiveProvider } from '../hooks/useActiveProvider';
import { metadataHost } from '../services/metadataHost';

const mapTrackRefs = (refs: TrackRef[]): Track[] =>
  refs.map((ref) => ({
    ...ref,
    artists: ref.artists.map((artist) => ({ name: artist.name, roles: [] })),
  }));

type ArtistSectionProps = {
  providerId: string;
  artistId: string;
};

const ArtistBioHeader: FC<ArtistSectionProps> = ({ providerId, artistId }) => {
  const { t } = useTranslation('artist');
  const {
    data: artist,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['artist-bio', providerId, artistId],
    queryFn: () => metadataHost.fetchArtistBio(artistId, providerId),
    enabled: Boolean(providerId && artistId),
  });

  if (isLoading) {
    return (
      <div className="border-border bg-primary shadow-shadow m-4 flex items-center justify-center rounded-md border-(length:--border-width) p-6">
        <Loader size="xl" data-testid="artist-header-loader" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="border-border bg-primary shadow-shadow m-4 rounded-md border-(length:--border-width) p-6">
        <div className="text-accent-red">{t('errors.failedToLoadDetails')}</div>
      </div>
    );
  }

  if (!artist) {
    return null;
  }

  const cover = pickArtwork(artist.artwork, 'cover', 1200);
  const avatar = pickArtwork(artist.artwork, 'avatar', 300);

  return (
    <div className="border-border bg-primary shadow-shadow relative m-4 rounded-md border-(length:--border-width) p-6">
      <ConnectedFavoriteButton
        type="artist"
        source={{ provider: providerId, id: artistId }}
        data={{ name: artist.name, artwork: artist.artwork }}
        className="bg-background border-border absolute top-4 right-4 z-10 rounded-md border-(length:--border-width)"
        data-testid="artist-favorite-button"
      />
      <div className="flex gap-6">
        <div className="flex flex-1 flex-col gap-4">
          <div className="flex items-center gap-5">
            {avatar && (
              <img
                className="border-border shadow-shadow h-24 w-24 rounded-full border-(length:--border-width) object-cover"
                src={avatar.url}
                alt={`${artist.name} avatar`}
              />
            )}
            <div className="flex flex-col gap-1">
              <h1 className="font-heading text-5xl font-extrabold tracking-tight">
                {artist.name}
              </h1>
              {artist.disambiguation && (
                <span className="text-foreground-secondary text-sm">
                  {artist.disambiguation}
                </span>
              )}
            </div>
          </div>
          {!isEmpty(artist.tags) && (
            <div className="flex flex-wrap gap-2">
              {artist.tags?.map((tag) => (
                <span
                  key={tag}
                  className="border-border bg-background rounded-md border px-2 py-0.5 text-sm font-bold"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
          {artist.onTour && (
            <span className="bg-accent-green border-border inline-flex w-fit rounded-md border px-2 py-0.5 text-sm font-bold">
              {t('onTour')}
            </span>
          )}
          {artist.bio && (
            <p className="text-foreground-secondary line-clamp-5 text-sm leading-relaxed">
              {artist.bio}
            </p>
          )}
        </div>
        {cover && (
          <div className="w-72 shrink-0 self-stretch">
            <img
              className="border-border shadow-shadow h-full w-full rounded-md border-(length:--border-width) object-cover"
              src={cover.url}
              alt={`${artist.name} cover`}
            />
          </div>
        )}
      </div>
    </div>
  );
};

const compactFormatter = new Intl.NumberFormat('en', { notation: 'compact' });

type StatDefinition = {
  key: string;
  icon: LucideIcon;
  labelKey: string;
  value: number | undefined;
};

type ActiveStat = StatDefinition & { value: number };

const ArtistSocialHeader: FC<ArtistSectionProps> = ({
  providerId,
  artistId,
}) => {
  const { t } = useTranslation('artist');
  const {
    data: stats,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['artist-social-stats', providerId, artistId],
    queryFn: () => metadataHost.fetchArtistSocialStats(artistId, providerId),
    enabled: Boolean(providerId && artistId),
  });

  if (isLoading) {
    return (
      <div className="m-4 flex items-center justify-center">
        <Loader data-testid="artist-social-header-loader" />
      </div>
    );
  }

  if (isError || !stats) {
    return null;
  }

  const avatar = pickArtwork(stats.artwork, 'avatar', 300);
  const location = [stats.city, stats.country].filter(Boolean).join(', ');

  const statDefinitions = [
    {
      key: 'followers',
      icon: Users,
      labelKey: 'followers',
      value: stats.followersCount,
    },
    {
      key: 'followings',
      icon: UserPlus,
      labelKey: 'followings',
      value: stats.followingsCount,
    },
    { key: 'tracks', icon: Music, labelKey: 'tracks', value: stats.trackCount },
    {
      key: 'playlists',
      icon: ListMusic,
      labelKey: 'playlists',
      value: stats.playlistCount,
    },
  ].filter(
    (stat): stat is ActiveStat => stat.value !== undefined && stat.value > 0,
  );

  return (
    <div className="border-border bg-primary shadow-shadow relative m-4 rounded-md border-(length:--border-width) p-6">
      <ConnectedFavoriteButton
        type="artist"
        source={{ provider: providerId, id: artistId }}
        data={{ name: stats.name, artwork: stats.artwork }}
        className="bg-background border-border absolute top-4 right-4 z-10 rounded-md border-(length:--border-width)"
        data-testid="artist-favorite-button"
      />
      <div className="flex items-center gap-5">
        {avatar && (
          <img
            className="border-border shadow-shadow h-24 w-24 rounded-full border-(length:--border-width) object-cover"
            src={avatar.url}
            alt={`${stats.name} avatar`}
          />
        )}
        <div className="flex flex-col gap-1">
          <h2 className="font-heading text-3xl font-extrabold tracking-tight">
            {stats.name}
          </h2>
          {location && (
            <span className="bg-accent-orange border-border inline-flex w-fit items-center gap-1 rounded-md border px-2 py-0.5 text-sm font-bold">
              <MapPin size={14} />
              {location}
            </span>
          )}
        </div>
      </div>
      {statDefinitions.length > 0 && (
        <div className="mt-5 flex flex-wrap gap-3">
          {statDefinitions.map((stat) => (
            <StatChip
              key={stat.key}
              value={compactFormatter.format(stat.value)}
              label={t(stat.labelKey)}
              icon={<stat.icon size={16} />}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const ArtistPopularTracks: FC<ArtistSectionProps> = ({
  providerId,
  artistId,
}) => {
  const { t } = useTranslation('artist');
  const {
    data: rawTracks,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['artist-top-tracks', providerId, artistId],
    queryFn: async () => {
      const refs = await metadataHost.fetchArtistTopTracks(
        artistId,
        providerId,
      );
      return mapTrackRefs(refs);
    },
    enabled: Boolean(providerId && artistId),
  });

  const tracks = useMemo(() => rawTracks ?? [], [rawTracks]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader data-testid="popular-tracks-loader" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-accent-red p-4">
        {t('errors.failedToLoadPopularTracks')}
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <h2 className="mb-2 text-lg font-semibold">{t('popularTracks')}</h2>
      <ConnectedTrackTable
        tracks={tracks}
        features={{ filterable: false, playAll: true, addAllToQueue: true }}
        display={{ displayDuration: false }}
      />
    </div>
  );
};

const ArtistAlbumsGrid: FC<ArtistSectionProps> = ({ providerId, artistId }) => {
  const { t } = useTranslation('artist');
  const navigate = useNavigate();
  const provider = useActiveProvider('metadata') as
    | MetadataProvider
    | undefined;
  const {
    data: albums,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['artist-albums', providerId, artistId],
    queryFn: () => metadataHost.fetchArtistAlbums(artistId, providerId),
    enabled: Boolean(providerId && artistId),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader data-testid="artist-albums-loader" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-start gap-3 p-8">
        <div className="text-accent-red">{t('errors.failedToLoadAlbums')}</div>
      </div>
    );
  }

  return (
    <CardGrid className="mx-4">
      {albums?.map((album) => (
        <Card
          key={album.source.id}
          title={album.title}
          subtitle={album.artists?.map((artist) => artist.name).join(', ')}
          src={pickArtwork(album.artwork, 'cover', 300)?.url}
          onClick={
            provider
              ? () =>
                  navigate({ to: `/album/${provider.id}/${album.source.id}` })
              : undefined
          }
        />
      ))}
    </CardGrid>
  );
};

const ArtistSimilarArtists: FC<ArtistSectionProps> = ({
  providerId,
  artistId,
}) => {
  const { t } = useTranslation('artist');
  const {
    data: artists,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['artist-related-artists', providerId, artistId],
    queryFn: () => metadataHost.fetchArtistRelatedArtists(artistId, providerId),
    enabled: Boolean(providerId && artistId),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader data-testid="similar-artists-loader" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-accent-red p-4">
        {t('errors.failedToLoadSimilarArtists')}
      </div>
    );
  }

  return (
    !isEmpty(artists) && (
      <div className="flex flex-col">
        <h2 className="mb-2 text-lg font-semibold">{t('similar')}</h2>
        <ul className="divide-border bg-primary border-border divide-y-(length:--border-width) border border-(length:--border-width)">
          {artists!.slice(0, 5).map((artist) => {
            const thumb = pickArtwork(artist.artwork, 'thumbnail', 64);
            const avatar = thumb ?? pickArtwork(artist.artwork, 'avatar', 64);
            return (
              <li
                key={artist.source.id}
                className="flex cursor-default items-center gap-3 select-none"
              >
                {avatar ? (
                  <img
                    src={avatar.url}
                    alt={artist.name}
                    className="h-10 w-10 object-cover"
                  />
                ) : (
                  <div className="h-10 w-10" />
                )}
                <span className="truncate">{artist.name}</span>
              </li>
            );
          })}
        </ul>
      </div>
    )
  );
};

const ArtistPlaylistsGrid: FC<ArtistSectionProps> = ({
  providerId,
  artistId,
}) => {
  const { t } = useTranslation('artist');
  const {
    data: playlists,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['artist-playlists', providerId, artistId],
    queryFn: () => metadataHost.fetchArtistPlaylists(artistId, providerId),
    enabled: Boolean(providerId && artistId),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader data-testid="artist-playlists-loader" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-start gap-3 p-8">
        <div className="text-accent-red">
          {t('errors.failedToLoadPlaylists')}
        </div>
      </div>
    );
  }

  return (
    <CardGrid className="px-4">
      {playlists?.map((playlist) => (
        <Card
          key={playlist.source.id}
          title={playlist.name}
          src={pickArtwork(playlist.artwork, 'cover', 300)?.url}
        />
      ))}
    </CardGrid>
  );
};

export const WebArtist: FC = () => {
  const { providerId, artistId } = useParams({
    from: '/artist/$providerId/$artistId',
  });
  const provider = useActiveProvider('metadata') as
    | MetadataProvider
    | undefined;
  const capabilities = new Set(provider?.artistMetadataCapabilities ?? []);

  return (
    <ScrollableArea className="bg-background" data-testid="artist-view">
      {capabilities.has('artistBio') && (
        <ArtistBioHeader providerId={providerId} artistId={artistId} />
      )}
      {capabilities.has('artistSocialStats') && (
        <ArtistSocialHeader providerId={providerId} artistId={artistId} />
      )}
      <div className="mx-4 mb-4 flex flex-col gap-4 md:flex-row">
        {capabilities.has('artistTopTracks') && (
          <div className="md:w-2/3">
            <ArtistPopularTracks providerId={providerId} artistId={artistId} />
          </div>
        )}
        {capabilities.has('artistRelatedArtists') && (
          <div className="md:w-1/3">
            <ArtistSimilarArtists providerId={providerId} artistId={artistId} />
          </div>
        )}
      </div>
      {capabilities.has('artistAlbums') && (
        <ArtistAlbumsGrid providerId={providerId} artistId={artistId} />
      )}
      {capabilities.has('artistPlaylists') && (
        <ArtistPlaylistsGrid providerId={providerId} artistId={artistId} />
      )}
    </ScrollableArea>
  );
};
