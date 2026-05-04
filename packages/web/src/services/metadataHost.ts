import type {
  SearchCategory,
  SearchParams,
  SearchResults,
} from '@nuclearplayer/model';
import type { MetadataHost, MetadataProvider } from '@nuclearplayer/plugin-sdk';

import { providersHost } from './providersHost';

const ALL_CATEGORIES: SearchCategory[] = [
  'artists',
  'albums',
  'tracks',
  'playlists',
];

const onlyCategories = (values: string[] | undefined): SearchCategory[] => {
  if (!values) {
    return [];
  }
  const set = new Set<SearchCategory>(ALL_CATEGORIES);
  return values.filter((value): value is SearchCategory =>
    set.has(value as SearchCategory),
  );
};

const resolveTypes = (
  provider: MetadataProvider,
  requested: SearchCategory[] | undefined,
): SearchCategory[] => {
  return requested ?? onlyCategories(provider.searchCapabilities);
};

const executeSearch = async (
  provider: MetadataProvider,
  params: SearchParams,
): Promise<SearchResults> => {
  const unified =
    provider.searchCapabilities?.includes('unified') && provider.search;
  if (unified) {
    return provider.search!(params);
  }

  const types = resolveTypes(provider, params.types);
  const want = new Set(types);

  const [artists, albums, tracks, playlists] = await Promise.all([
    want.has('artists') && provider.searchArtists
      ? provider.searchArtists({ query: params.query, limit: params.limit })
      : Promise.resolve(undefined),
    want.has('albums') && provider.searchAlbums
      ? provider.searchAlbums({ query: params.query, limit: params.limit })
      : Promise.resolve(undefined),
    want.has('tracks') && provider.searchTracks
      ? provider.searchTracks({ query: params.query, limit: params.limit })
      : Promise.resolve(undefined),
    want.has('playlists') && provider.searchPlaylists
      ? provider.searchPlaylists({ query: params.query, limit: params.limit })
      : Promise.resolve(undefined),
  ]);

  const result: SearchResults = {};
  if (artists) {
    result.artists = artists;
  }
  if (albums) {
    result.albums = albums;
  }
  if (tracks) {
    result.tracks = tracks;
  }
  if (playlists) {
    result.playlists = playlists;
  }
  return result;
};

export const createMetadataHost = (): MetadataHost => {
  const getProvider = (providerId?: string): MetadataProvider | undefined =>
    providersHost.get<MetadataProvider>(
      providerId ?? providersHost.getActive('metadata'),
      'metadata',
    );

  return {
    search: async (params: SearchParams, providerId?: string) => {
      const provider = getProvider(providerId);
      if (!provider) {
        throw new Error('No metadata provider available');
      }
      return executeSearch(provider, params);
    },

    fetchArtistBio: async (artistId, providerId) => {
      const provider = getProvider(providerId);
      if (!provider?.fetchArtistBio) {
        throw new Error('Artist bio not supported by this provider');
      }
      return provider.fetchArtistBio(artistId);
    },

    fetchArtistSocialStats: async (artistId, providerId) => {
      const provider = getProvider(providerId);
      if (!provider?.fetchArtistSocialStats) {
        throw new Error('Artist social stats not supported by this provider');
      }
      return provider.fetchArtistSocialStats(artistId);
    },

    fetchArtistAlbums: async (artistId, providerId) => {
      const provider = getProvider(providerId);
      if (!provider?.fetchArtistAlbums) {
        throw new Error('Artist albums not supported by this provider');
      }
      return provider.fetchArtistAlbums(artistId);
    },

    fetchArtistTopTracks: async (artistId, providerId) => {
      const provider = getProvider(providerId);
      if (!provider?.fetchArtistTopTracks) {
        throw new Error('Artist top tracks not supported by this provider');
      }
      return provider.fetchArtistTopTracks(artistId);
    },

    fetchArtistPlaylists: async (artistId, providerId) => {
      const provider = getProvider(providerId);
      if (!provider?.fetchArtistPlaylists) {
        throw new Error('Artist playlists not supported by this provider');
      }
      return provider.fetchArtistPlaylists(artistId);
    },

    fetchArtistRelatedArtists: async (artistId, providerId) => {
      const provider = getProvider(providerId);
      if (!provider?.fetchArtistRelatedArtists) {
        throw new Error(
          'Artist related artists not supported by this provider',
        );
      }
      return provider.fetchArtistRelatedArtists(artistId);
    },

    fetchAlbumDetails: async (albumId, providerId) => {
      const provider = getProvider(providerId);
      if (!provider?.fetchAlbumDetails) {
        throw new Error('Album details not supported by this provider');
      }
      return provider.fetchAlbumDetails(albumId);
    },
  };
};

export const metadataHost = createMetadataHost();
