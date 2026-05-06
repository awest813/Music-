import type {
  Album,
  AlbumRef,
  ArtistBio,
  ArtistRef,
  PlaylistRef,
  SearchResults,
  Track,
  TrackRef,
} from '@nuclearplayer/model';
import type {
  DashboardProvider,
  MetadataProvider,
  StreamingProvider,
} from '@nuclearplayer/plugin-sdk';

import { providersHost } from '../services/providersHost';
import {
  createServerStreamingProvider,
  isServerStreamingProviderAvailable,
} from './serverStreamingProvider';

const DEMO_PROVIDER_ID = 'demo-provider';

const demoSource = (id: string) => ({ provider: DEMO_PROVIDER_ID, id });

const DEMO_TRACKS: Track[] = [
  {
    title: 'Bohemian Rhapsody',
    artists: [{ name: 'Queen', roles: [] }],
    durationMs: 354000,
    artwork: {
      items: [
        {
          url: 'https://upload.wikimedia.org/wikipedia/en/9/9f/Bohemian_Rhapsody.png',
          purpose: 'thumbnail',
          width: 64,
        },
      ],
    },
    source: demoSource('track-1'),
  },
  {
    title: 'Stairway to Heaven',
    artists: [{ name: 'Led Zeppelin', roles: [] }],
    durationMs: 482000,
    artwork: {
      items: [
        {
          url: 'https://upload.wikimedia.org/wikipedia/en/1/1a/LedZeppelinIV.jpg',
          purpose: 'thumbnail',
          width: 64,
        },
      ],
    },
    source: demoSource('track-2'),
  },
  {
    title: 'Hotel California',
    artists: [{ name: 'Eagles', roles: [] }],
    durationMs: 391000,
    artwork: {
      items: [
        {
          url: 'https://upload.wikimedia.org/wikipedia/en/4/49/Hotelcalifornia.jpg',
          purpose: 'thumbnail',
          width: 64,
        },
      ],
    },
    source: demoSource('track-3'),
  },
  {
    title: 'Comfortably Numb',
    artists: [{ name: 'Pink Floyd', roles: [] }],
    durationMs: 382000,
    artwork: {
      items: [
        {
          url: 'https://upload.wikimedia.org/wikipedia/en/3/3b/Dark_Side_of_the_Moon.png',
          purpose: 'thumbnail',
          width: 64,
        },
      ],
    },
    source: demoSource('track-4'),
  },
  {
    title: 'Imagine',
    artists: [{ name: 'John Lennon', roles: [] }],
    durationMs: 183000,
    artwork: {
      items: [
        {
          url: 'https://upload.wikimedia.org/wikipedia/en/9/9b/Imagine_Dragon.jpg',
          purpose: 'thumbnail',
          width: 64,
        },
      ],
    },
    source: demoSource('track-5'),
  },
  {
    title: 'Smells Like Teen Spirit',
    artists: [{ name: 'Nirvana', roles: [] }],
    durationMs: 301000,
    artwork: {
      items: [
        {
          url: 'https://upload.wikimedia.org/wikipedia/en/b/b7/NirvanaNevermindalbumcover.jpg',
          purpose: 'thumbnail',
          width: 64,
        },
      ],
    },
    source: demoSource('track-6'),
  },
];

const DEMO_ALBUMS: Album[] = [
  {
    title: 'A Night at the Opera',
    artists: [{ name: 'Queen', roles: [] }],
    releaseDate: { precision: 'day', dateIso: '1975-11-21' },
    genres: ['Rock'],
    artwork: {
      items: [
        {
          url: 'https://upload.wikimedia.org/wikipedia/en/9/9f/Bohemian_Rhapsody.png',
          purpose: 'cover',
          width: 300,
        },
      ],
    },
    source: demoSource('album-opera'),
    tracks: DEMO_TRACKS.slice(0, 2).map((t) => ({
      title: t.title,
      artists: [
        { name: t.artists[0].name, source: demoSource('artist-queen') },
      ],
      durationMs: t.durationMs,
      source: t.source,
    })),
  },
  {
    title: 'Led Zeppelin IV',
    artists: [{ name: 'Led Zeppelin', roles: [] }],
    releaseDate: { precision: 'day', dateIso: '1971-11-08' },
    genres: ['Rock', 'Hard Rock'],
    artwork: {
      items: [
        {
          url: 'https://upload.wikimedia.org/wikipedia/en/1/1a/LedZeppelinIV.jpg',
          purpose: 'cover',
          width: 300,
        },
      ],
    },
    source: demoSource('album-iv'),
    tracks: DEMO_TRACKS.slice(1, 2).map((t) => ({
      title: t.title,
      artists: [{ name: t.artists[0].name, source: demoSource('artist-zep') }],
      durationMs: t.durationMs,
      source: t.source,
    })),
  },
  {
    title: 'Hotel California',
    artists: [{ name: 'Eagles', roles: [] }],
    releaseDate: { precision: 'day', dateIso: '1976-12-08' },
    genres: ['Rock'],
    artwork: {
      items: [
        {
          url: 'https://upload.wikimedia.org/wikipedia/en/4/49/Hotelcalifornia.jpg',
          purpose: 'cover',
          width: 300,
        },
      ],
    },
    source: demoSource('album-hotel'),
    tracks: DEMO_TRACKS.slice(2, 3).map((t) => ({
      title: t.title,
      artists: [
        { name: t.artists[0].name, source: demoSource('artist-eagles') },
      ],
      durationMs: t.durationMs,
      source: t.source,
    })),
  },
];

const DEMO_ARTIST_REFS: ArtistRef[] = [
  {
    name: 'Queen',
    artwork: {
      items: [
        {
          url: 'https://upload.wikimedia.org/wikipedia/en/9/9f/Bohemian_Rhapsody.png',
          purpose: 'avatar',
          width: 300,
        },
      ],
    },
    source: demoSource('artist-queen'),
  },
  {
    name: 'Led Zeppelin',
    artwork: {
      items: [
        {
          url: 'https://upload.wikimedia.org/wikipedia/en/1/1a/LedZeppelinIV.jpg',
          purpose: 'avatar',
          width: 300,
        },
      ],
    },
    source: demoSource('artist-zep'),
  },
  {
    name: 'Pink Floyd',
    artwork: {
      items: [
        {
          url: 'https://upload.wikimedia.org/wikipedia/en/3/3b/Dark_Side_of_the_Moon.png',
          purpose: 'avatar',
          width: 300,
        },
      ],
    },
    source: demoSource('artist-floyd'),
  },
  {
    name: 'Nirvana',
    artwork: {
      items: [
        {
          url: 'https://upload.wikimedia.org/wikipedia/en/b/b7/NirvanaNevermindalbumcover.jpg',
          purpose: 'avatar',
          width: 300,
        },
      ],
    },
    source: demoSource('artist-nirvana'),
  },
];

const DEMO_ALBUM_REFS: AlbumRef[] = DEMO_ALBUMS.map((a) => ({
  title: a.title,
  artists: a.artists.map((ar) => ({
    name: ar.name,
    source: demoSource(`artist-${ar.name.toLowerCase().replace(/\s+/g, '-')}`),
  })),
  artwork: a.artwork,
  source: a.source,
}));

const DEMO_TRACK_REFS: TrackRef[] = DEMO_TRACKS.map((t) => ({
  title: t.title,
  artists: t.artists.map((ar) => ({
    name: ar.name,
    source: demoSource(`artist-${ar.name.toLowerCase().replace(/\s+/g, '-')}`),
  })),
  artwork: t.artwork,
  source: t.source,
}));

const DEMO_EDITORIAL_PLAYLISTS: PlaylistRef[] = [
  {
    id: 'playlist-rock-classics',
    name: 'Rock Classics',
    artwork: {
      items: [
        {
          url: 'https://upload.wikimedia.org/wikipedia/en/9/9f/Bohemian_Rhapsody.png',
          purpose: 'cover',
          width: 300,
        },
      ],
    },
    source: demoSource('playlist-rock'),
  },
  {
    id: 'playlist-70s-hits',
    name: '70s Hits',
    artwork: {
      items: [
        {
          url: 'https://upload.wikimedia.org/wikipedia/en/1/1a/LedZeppelinIV.jpg',
          purpose: 'cover',
          width: 300,
        },
      ],
    },
    source: demoSource('playlist-70s'),
  },
];

const searchTracks = (query: string): Track[] =>
  DEMO_TRACKS.filter((t) =>
    t.title.toLowerCase().includes(query.toLowerCase()),
  );

const searchAlbums = (query: string): AlbumRef[] =>
  DEMO_ALBUM_REFS.filter((a) =>
    a.title.toLowerCase().includes(query.toLowerCase()),
  );

const searchArtists = (query: string): ArtistRef[] =>
  DEMO_ARTIST_REFS.filter((a) =>
    a.name.toLowerCase().includes(query.toLowerCase()),
  );

export const createDemoMetadataProvider = (): MetadataProvider => ({
  id: DEMO_PROVIDER_ID,
  name: 'Demo Provider',
  kind: 'metadata',
  streamingProviderId: undefined,
  searchCapabilities: ['unified'],

  search: async ({ query }): Promise<SearchResults> => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return {
      tracks: searchTracks(query),
      albums: searchAlbums(query),
      artists: searchArtists(query),
    };
  },

  searchTracks: async ({ query }) => searchTracks(query),
  searchAlbums: async ({ query }) => searchAlbums(query),
  searchArtists: async ({ query }) => searchArtists(query),

  fetchAlbumDetails: async (albumId) => {
    await new Promise((resolve) => setTimeout(resolve, 200));
    const album = DEMO_ALBUMS.find((a) => a.source.id === albumId);
    if (!album) {
      throw new Error(`Album not found: ${albumId}`);
    }
    return album;
  },

  fetchArtistBio: async (artistId): Promise<ArtistBio> => {
    await new Promise((resolve) => setTimeout(resolve, 200));
    const artist = DEMO_ARTIST_REFS.find((a) => a.source.id === artistId);
    if (!artist) {
      throw new Error(`Artist not found: ${artistId}`);
    }
    return {
      name: artist.name,
      bio: `Demo bio for ${artist.name}`,
      source: artist.source,
    };
  },

  fetchArtistAlbums: async (artistId): Promise<AlbumRef[]> => {
    await new Promise((resolve) => setTimeout(resolve, 200));
    return DEMO_ALBUM_REFS.filter((a) =>
      a.artists?.some((ar) => ar.source.id === artistId),
    );
  },

  fetchArtistTopTracks: async (): Promise<TrackRef[]> => {
    await new Promise((resolve) => setTimeout(resolve, 200));
    return DEMO_TRACK_REFS.slice(0, 3);
  },
});

export const createDemoDashboardProvider = (): DashboardProvider => ({
  id: 'demo-dashboard',
  name: 'Demo Dashboard',
  kind: 'dashboard',
  metadataProviderId: DEMO_PROVIDER_ID,
  capabilities: [
    'topTracks',
    'topArtists',
    'topAlbums',
    'editorialPlaylists',
    'newReleases',
  ],

  fetchTopTracks: async () => DEMO_TRACKS.slice(0, 5),
  fetchTopArtists: async () => DEMO_ARTIST_REFS,
  fetchTopAlbums: async () => DEMO_ALBUM_REFS,
  fetchEditorialPlaylists: async () => DEMO_EDITORIAL_PLAYLISTS,
  fetchNewReleases: async () => DEMO_ALBUM_REFS,
});

export const createDemoStreamingProvider = (): StreamingProvider => ({
  id: 'demo-streaming',
  name: 'Demo Streaming',
  kind: 'streaming',

  searchForTrack: async (artist: string, title: string) => {
    await new Promise((resolve) => setTimeout(resolve, 100));
    const streamId = `${artist}-${title}`.toLowerCase().replace(/\s+/g, '-');
    return [
      {
        id: streamId,
        title: `${artist} - ${title}`,
        failed: false,
        source: { provider: 'demo-streaming', id: streamId },
      },
    ];
  },

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getStreamUrl: async (_candidateId: string) => {
    await new Promise((resolve) => setTimeout(resolve, 100));
    return {
      url: 'https://upload.wikimedia.org/wikipedia/commons/transcoded/3/3c/Johann_Sebastian_Bach_-_Cello_Suite_No._1_in_G_major%2C_BWV_1007_-_I._Prelude.ogg/Johann_Sebastian_Bach_-_Cello_Suite_No._1_in_G_major%2C_BWV_1007_-_I._Prelude.ogg.mp3',
      protocol: 'http' as const,
      source: { provider: 'demo-streaming', id: 'demo-stream' },
      mimeType: 'audio/mpeg',
    };
  },
});

export const registerDemoProviders = async (): Promise<void> => {
  const metadataProvider = createDemoMetadataProvider();
  const dashboardProvider = createDemoDashboardProvider();
  const demoStreaming = createDemoStreamingProvider();
  const serverStreaming = createServerStreamingProvider();

  providersHost.register(metadataProvider);
  providersHost.register(dashboardProvider);

  providersHost.register(serverStreaming);
  providersHost.register(demoStreaming);

  const serverAvailable = await isServerStreamingProviderAvailable();
  if (serverAvailable) {
    providersHost.setActive('streaming', serverStreaming.id);
  } else {
    providersHost.setActive('streaming', demoStreaming.id);
  }
};
